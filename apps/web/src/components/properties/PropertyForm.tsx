import React, { useEffect, useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  MapPinned,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Camera,
  Upload,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { handleApiError, toUserFacingError } from '../../utils/userFacingError';
import {
  SectionCard,
  FieldLabel,
  inputCls,
  selectCls,
  PROPERTY_CATEGORIES,
  FACING_OPTIONS,
  brandForCategory,
  lookupPincode,
  categoryTabGroupOf,
  CategoryTabGroup,
} from './propertyWizardShared';
import { CostSheet } from '../shared/CostSheet';
import {
  createProperty,
  updateProperty,
  uploadPropertyImage,
  setPropertyImagePrimary,
  deletePropertyImage,
  PropertyInput,
  PropertyCategory,
  Property,
  PropertyImage,
} from '../../api/properties';
import { ChargeCalcMethod, ChargeCategory } from '../../api/projectUnits';
import { resolveImageUrl } from '../../utils/imageUtils';

// One form, two modes (implementation plan section 8.2) — the fix for "Edit
// is a lesser form than Add". Rebuilt as a genuine multi-step wizard (not a
// single scrolling page) so each of the property spec's 7 real property
// types (property details.md) gets its OWN identity/size/position/features
// fields instead of every type sharing one generic field set — that generic
// sharing was the exact complaint this rebuild fixes. The manually-typed
// `price` field was removed (§ Phase 3) — it could silently diverge from the
// pricing engine's own final_price. Base Rate (in the Pricing step) is now
// the required input that actually drives the computed price everywhere.

type DetailKey =
  | 'plot_details'
  | 'apartment_details'
  | 'villa_details'
  | 'house_details'
  | 'commercial_shop_details'
  | 'commercial_office_details'
  | 'farm_land_details';

/** Which category-specific detail sub-record a given `category` value writes
 * to — mirrors PropertyService's 7 real Prisma sub-tables one-to-one. */
function detailKeyForCategory(category: string): DetailKey {
  switch (category) {
    case 'PLOT':
      return 'plot_details';
    case 'APARTMENT':
    case 'STUDIO':
    case 'PENTHOUSE':
    case 'INDEPENDENT_FLOOR':
      return 'apartment_details';
    case 'VILLA':
      return 'villa_details';
    case 'INDEPENDENT_HOUSE':
    case 'DUPLEX':
      return 'house_details';
    case 'COMMERCIAL_SHOP':
      return 'commercial_shop_details';
    case 'COMMERCIAL_OFFICE':
      return 'commercial_office_details';
    case 'FARM_HOUSE':
    case 'AGRICULTURAL_LAND':
      return 'farm_land_details';
    default:
      return 'apartment_details';
  }
}

const PRICE_BASIS_BY_GROUP: Record<CategoryTabGroup, PropertyInput['price_basis']> = {
  LAND: 'PLOT_AREA',
  VILLA: 'BUILT_UP',
  HOUSE: 'BUILT_UP',
  FLAT: 'SUPER_BUILT_UP',
  COMMERCIAL: 'SUPER_BUILT_UP',
  OTHER: 'LUMPSUM',
};

const STEPS = [
  'Category',
  'Basic Details',
  'Location',
  'Size & Details',
  'Pricing',
  'Photos',
  'Review',
] as const;
type Step = (typeof STEPS)[number];

const emptyForm = (): PropertyInput => ({
  title: '',
  brand_type: 'SONTHILLU',
  category: 'VILLA',
  area_sqft: 0,
  location: '',
});

// Edit mode seeds `form` from the full fetched Property, which carries
// dozens of server-only/computed fields (id, status, calculated_price,
// price_lines, ...) that PropertyInput never declares. Submitting `form`
// as-is would forward all of that back; building the payload from an
// explicit key list is the real fix — never send a field this form doesn't manage.
const PROPERTY_INPUT_KEYS: (keyof PropertyInput)[] = [
  'title',
  'description',
  'brand_type',
  'category',
  'area_sqft',
  'location',
  'address',
  'bedrooms',
  'bathrooms',
  'facing',
  'amenities',
  'possession_status',
  'assigned_pm_id',
  'project_id',
  'state',
  'city',
  'locality',
  'pincode',
  'latitude',
  'longitude',
  'listing_type',
  'area_value',
  'area_unit',
  'plot_area_sqyd',
  'plot_length_ft',
  'plot_width_ft',
  'carpet_area_sqft',
  'built_up_area_sqft',
  'super_built_up_area_sqft',
  'ground_floor_area_sqft',
  'first_floor_area_sqft',
  'total_floors',
  'construction_year',
  'price_basis',
  'view',
  'road_width_ft',
  'is_corner',
  'is_park_facing',
  'is_road_facing',
  'is_main_road_facing',
  'is_premium_location',
  'base_rate',
  'base_rate_unit',
  'discount_amount',
  'discount_reason',
  'manual_lines',
];
const DETAIL_KEYS: DetailKey[] = [
  'plot_details',
  'apartment_details',
  'villa_details',
  'house_details',
  'commercial_shop_details',
  'commercial_office_details',
  'farm_land_details',
];

function buildPayload(form: PropertyInput, details: Record<DetailKey, any>): any {
  const payload: any = {};
  for (const key of PROPERTY_INPUT_KEYS) payload[key] = (form as any)[key];
  // Only the detail object matching the current category is ever sent — the
  // other 6 stay untouched server-side (see subRecordUpdate: undefined = no-op).
  const activeKey = detailKeyForCategory(form.category);
  for (const key of DETAIL_KEYS) payload[key] = key === activeKey ? details[key] || {} : undefined;
  return payload;
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  property?: Property;
  onClose: () => void;
  onSuccess: (property: Property) => void;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  mode,
  property,
  onClose,
  onSuccess,
}) => {
  const { fetchWithAuth } = useAuth();
  const { showToast, showError } = useToast();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<PropertyInput>(() =>
    property ? { ...emptyForm(), ...property } : emptyForm(),
  );
  const [details, setDetails] = useState<Record<DetailKey, any>>(() => {
    const seeded: any = {};
    for (const key of DETAIL_KEYS) seeded[key] = (property as any)?.[key] || {};
    return seeded;
  });
  const [submitting, setSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Photos step. Create mode has no property id yet, so files are staged
  // locally (object URLs) and uploaded only after a successful create; edit
  // mode already has an id, so uploads/deletes/cover-changes happen live,
  // the same way PropertyManagement's Media tab does.
  const [stagedImages, setStagedImages] = useState<{ file: File; preview: string }[]>([]);
  const [stagedCoverIndex, setStagedCoverIndex] = useState(0);
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(
    (property?.images as PropertyImage[]) || [],
  );
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    return () => {
      stagedImages.forEach((s) => URL.revokeObjectURL(s.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stageFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const added = Array.from(files).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setStagedImages((prev) => [...prev, ...added]);
  };
  const removeStagedImage = (index: number) => {
    setStagedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      const next = prev.filter((_, i) => i !== index);
      return next;
    });
    setStagedCoverIndex((prev) => (prev === index ? 0 : prev > index ? prev - 1 : prev));
  };

  const handleUploadExisting = async (files: FileList | null) => {
    if (!files || files.length === 0 || !property) return;
    setImageBusy(true);
    try {
      for (const file of Array.from(files)) {
        const { image } = await uploadPropertyImage(
          fetchWithAuth,
          property.id,
          file,
          existingImages.length === 0,
        );
        setExistingImages((prev) =>
          image.is_primary
            ? [...prev.map((i) => ({ ...i, is_primary: false })), image]
            : [...prev, image],
        );
      }
      showToast('Photo uploaded', 'success');
    } catch (err: any) {
      showError(toUserFacingError({ message: err?.message || 'Failed to upload photo' }));
    } finally {
      setImageBusy(false);
    }
  };
  const handleSetPrimaryExisting = async (imageId: number) => {
    if (!property) return;
    setImageBusy(true);
    try {
      await setPropertyImagePrimary(fetchWithAuth, property.id, imageId);
      setExistingImages((prev) => prev.map((i) => ({ ...i, is_primary: i.id === imageId })));
    } catch (err: any) {
      showError(toUserFacingError({ message: err?.message || 'Failed to set cover image' }));
    } finally {
      setImageBusy(false);
    }
  };
  const handleDeleteExisting = async (imageId: number) => {
    if (!property) return;
    if (!window.confirm('Delete this photo?')) return;
    setImageBusy(true);
    try {
      await deletePropertyImage(fetchWithAuth, property.id, imageId);
      setExistingImages((prev) => prev.filter((i) => i.id !== imageId));
    } catch (err: any) {
      showError(toUserFacingError({ message: err?.message || 'Failed to delete photo' }));
    } finally {
      setImageBusy(false);
    }
  };

  const group = categoryTabGroupOf(form.category);
  const detailKey = detailKeyForCategory(form.category);
  const set = <K extends keyof PropertyInput>(key: K, value: PropertyInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));
  const setDetail = (key: string, value: any) =>
    setDetails((d) => ({ ...d, [detailKey]: { ...d[detailKey], [key]: value } }));
  const detail = details[detailKey] || {};

  useEffect(() => {
    if (mode === 'create') {
      set('brand_type', brandForCategory(form.category) as any);
      set('price_basis', PRICE_BASIS_BY_GROUP[group]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.category]);

  const handlePincodeLookup = () => {
    if (!form.pincode) return;
    setIsLookingUp(true);
    lookupPincode(
      form.pincode,
      (state, city, locality, fullLocation) => {
        setForm((f) => ({ ...f, state, city, locality, location: f.location || fullLocation }));
      },
      showError,
      showToast,
    ).finally(() => setIsLookingUp(false));
  };

  const validateStep = (s: number): string | null => {
    if (STEPS[s] === 'Basic Details') {
      if (!form.title.trim()) return 'Title is required';
    }
    if (STEPS[s] === 'Location' && !form.location.trim()) return 'Location is required';
    if (STEPS[s] === 'Size & Details' && (!form.area_sqft || form.area_sqft <= 0))
      return 'Area (sqft) is required';
    if (STEPS[s] === 'Pricing' && (!form.base_rate || form.base_rate <= 0))
      return 'Base rate is required';
    return null;
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      showError({ message: err });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    for (let s = 0; s < STEPS.length - 1; s++) {
      const err = validateStep(s);
      if (err) {
        showError({ message: err });
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = buildPayload(form, details);
      if (mode === 'create') {
        const { property: created } = await createProperty(fetchWithAuth, payload);
        if (stagedImages.length > 0) {
          try {
            for (let i = 0; i < stagedImages.length; i++) {
              await uploadPropertyImage(
                fetchWithAuth,
                created.id,
                stagedImages[i].file,
                i === stagedCoverIndex,
              );
            }
          } catch {
            showError({
              message:
                "Property was created, but one or more photos failed to upload. You can add them from the property's Media tab.",
            });
          }
        }
        showToast('Property submitted for PM verification', 'success');
        onSuccess(created);
      } else if (property) {
        const { property: updated } = await updateProperty(fetchWithAuth, property.id, payload);
        showToast('Property updated', 'success');
        onSuccess(updated);
      }
    } catch (err: any) {
      if (err?.res) {
        await handleApiError(err.res, showError, err.data);
      } else {
        showError(
          toUserFacingError({ message: err?.message || 'Failed to save property', body: err }),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const addManualLine = () =>
    set('manual_lines', [...(form.manual_lines || []), { label: '', amount: 0 }]);
  const updateManualLine = (
    i: number,
    patch: Partial<{ label: string; category?: ChargeCategory; amount: number }>,
  ) => {
    const lines = [...(form.manual_lines || [])];
    lines[i] = { ...lines[i], ...patch };
    set('manual_lines', lines);
  };
  const removeManualLine = (i: number) =>
    set(
      'manual_lines',
      (form.manual_lines || []).filter((_, idx) => idx !== i),
    );

  // A read-only preview of the cost sheet this property would compute to,
  // purely for the admin's benefit — the authoritative computation always
  // happens server-side on submit.
  const previewComputation = () => {
    const areaSqft =
      group === 'LAND'
        ? (form.plot_area_sqyd || 0) * 9
        : form.super_built_up_area_sqft ||
          form.built_up_area_sqft ||
          form.carpet_area_sqft ||
          form.area_sqft ||
          0;
    const areaForRate = form.base_rate_unit === 'PER_SQYD' ? areaSqft / 9 : areaSqft;
    const base = form.base_rate ? form.base_rate * areaForRate : 0;
    const manual = (form.manual_lines || []).reduce((acc, l) => acc + (l.amount || 0), 0);
    const discount = form.discount_amount || 0;
    return { base, manual, discount, total: base + manual - discount };
  };
  const preview = previewComputation();

  // ---- Small local field helpers for the category-specific step ----------
  const Text = ({ label, k }: { label: string; k: string }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        className={inputCls}
        value={detail[k] || ''}
        onChange={(e) => setDetail(k, e.target.value)}
      />
    </div>
  );
  const Num = ({ label, k }: { label: string; k: string }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <input
        className={inputCls}
        type="number"
        value={detail[k] ?? ''}
        onChange={(e) => setDetail(k, e.target.value === '' ? null : parseFloat(e.target.value))}
      />
    </div>
  );
  const Check = ({ label, k }: { label: string; k: string }) => (
    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
      <input
        type="checkbox"
        checked={!!detail[k]}
        onChange={(e) => setDetail(k, e.target.checked)}
      />{' '}
      {label}
    </label>
  );
  const CheckRow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="col-span-2 md:col-span-3 flex flex-wrap gap-4 items-center pb-1">
      {children}
    </div>
  );

  const renderCategoryDetails = () => {
    switch (detailKey) {
      case 'plot_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Plot Number" k="plot_number" />
                <Text label="Phase" k="phase" />
                <Text label="Sector / Block" k="sector_block" />
                <Text label="Survey Number" k="survey_number" />
                <Text label="Subdivision Number" k="subdivision_number" />
              </div>
            </SectionCard>
            <SectionCard title="Plot Size">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel required>Plot Area (Sq.Yd)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_area_sqyd ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_area_sqyd',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Length (ft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_length_ft ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_length_ft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Width (ft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_width_ft ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_width_ft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Dimension (e.g. 30x60)" k="dimension_string" />
                <Num label="Frontage (ft)" k="frontage" />
                <div>
                  <FieldLabel>Road Width (ft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.road_width_ft ?? ''}
                    onChange={(e) =>
                      set(
                        'road_width_ft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Number of Roads" k="number_of_roads" />
              </div>
            </SectionCard>
            <SectionCard title="Location / Position">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <Check label="Corner Plot" k="is_corner" />
                  <Check label="Park Facing" k="is_park_facing" />
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_road_facing}
                      onChange={(e) => set('is_road_facing', e.target.checked)}
                    />{' '}
                    Road Facing
                  </label>
                  <Check label="Main Road Facing" k="is_main_road_facing" />
                  <Check label="Near Entrance" k="near_entrance" />
                  <Check label="Near Clubhouse" k="near_clubhouse" />
                  <Check label="Near Park" k="near_park" />
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_premium_location}
                      onChange={(e) => set('is_premium_location', e.target.checked)}
                    />{' '}
                    Premium Location
                  </label>
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Boundary">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Text label="North Boundary" k="north_boundary" />
                <Text label="South Boundary" k="south_boundary" />
                <Text label="East Boundary" k="east_boundary" />
                <Text label="West Boundary" k="west_boundary" />
              </div>
            </SectionCard>
          </>
        );

      case 'apartment_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Tower" k="tower" />
                <Text label="Block" k="block" />
                <Text label="Floor" k="floor" />
                <Text label="Unit Number" k="unit_number" />
                <Text label="Flat Number" k="flat_number" />
              </div>
            </SectionCard>
            <SectionCard title="Configuration">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="BHK (e.g. 3 BHK)" k="bhk" />
                <div>
                  <FieldLabel>Bedrooms</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.bedrooms ?? ''}
                    onChange={(e) =>
                      set('bedrooms', e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Bathrooms</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.bathrooms ?? ''}
                    onChange={(e) =>
                      set('bathrooms', e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <Num label="Balcony Count" k="balcony_count" />
                <CheckRow>
                  <Check label="Utility Area" k="has_utility_area" />
                  <Check label="Study Room" k="has_study_room" />
                  <Check label="Servant Room" k="has_servant_room" />
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Area">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Carpet Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.carpet_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'carpet_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel required>Super Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.super_built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'super_built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Balcony Area (sqft)" k="balcony_area" />
                <Num label="Terrace Area (sqft)" k="terrace_area" />
              </div>
            </SectionCard>
            <SectionCard title="Position">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_corner}
                      onChange={(e) => set('is_corner', e.target.checked)}
                    />{' '}
                    Corner Flat
                  </label>
                  <Check label="Park View" k="is_garden_view" />
                  <Check label="Pool View" k="is_pool_view" />
                  <Check label="Road View" k="is_road_view" />
                  <Check label="Main Road View" k="is_main_road_view" />
                  <Check label="City View" k="is_city_view" />
                  <Check label="Higher Floor" k="is_higher_floor" />
                  <Check label="Near Lift" k="is_near_lift" />
                  <Check label="Near Staircase" k="is_near_staircase" />
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Parking">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Parking Type" k="parking_type" />
                <Num label="Parking Slots" k="parking_slots" />
                <Text label="Parking Number" k="parking_number" />
                <CheckRow>
                  <Check label="Parking Included" k="parking_included" />
                  <Check label="Covered Parking" k="is_covered_parking" />
                  <Check label="Additional Parking" k="has_additional_parking" />
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Construction">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Structure" k="structure_type" />
                <Text label="Flooring" k="flooring" />
                <Text label="Electrical" k="electrical" />
                <Text label="Plumbing" k="plumbing" />
                <Text label="Doors" k="doors" />
                <Text label="Windows" k="windows" />
                <Text label="Kitchen" k="kitchen_type" />
                <Text label="Bathroom" k="bathroom_type" />
                <Text label="Paint" k="paint" />
                <Text label="Fixtures" k="fixtures" />
              </div>
            </SectionCard>
          </>
        );

      case 'villa_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Villa Number" k="villa_number" />
                <Text label="Villa Type" k="villa_type" />
                <Text label="BHK" k="bhk" />
              </div>
            </SectionCard>
            <SectionCard title="Configuration">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Bedrooms</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.bedrooms ?? ''}
                    onChange={(e) =>
                      set('bedrooms', e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Bathrooms</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.bathrooms ?? ''}
                    onChange={(e) =>
                      set('bathrooms', e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Total Floors</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.total_floors ?? ''}
                    onChange={(e) =>
                      set(
                        'total_floors',
                        e.target.value === '' ? null : parseInt(e.target.value, 10),
                      )
                    }
                  />
                </div>
                <CheckRow>
                  <Check label="Second Floor" k="has_second_floor" />
                  <Check label="Servant Room" k="has_servant_room" />
                  <Check label="Pooja Room" k="has_pooja_room" />
                  <Check label="Study Room" k="has_study_room" />
                  <Check label="Family Room" k="has_family_room" />
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Area">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Plot Area (Sq.Yd)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_area_sqyd ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_area_sqyd',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Ground Floor Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.ground_floor_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'ground_floor_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>First Floor Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.first_floor_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'first_floor_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Second Floor Area (sqft)" k="second_floor_area" />
                <Num label="Garden Area (sqft)" k="garden_area" />
                <Num label="Terrace Area (sqft)" k="terrace_area" />
              </div>
            </SectionCard>
            <SectionCard title="Location">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_corner}
                      onChange={(e) => set('is_corner', e.target.checked)}
                    />{' '}
                    Corner Villa
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_park_facing}
                      onChange={(e) => set('is_park_facing', e.target.checked)}
                    />{' '}
                    Park Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_road_facing}
                      onChange={(e) => set('is_road_facing', e.target.checked)}
                    />{' '}
                    Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_main_road_facing}
                      onChange={(e) => set('is_main_road_facing', e.target.checked)}
                    />{' '}
                    Main Road Facing
                  </label>
                  <Check label="Clubhouse Facing" k="is_clubhouse_facing" />
                  <Check label="Pool Facing" k="is_pool_facing" />
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_premium_location}
                      onChange={(e) => set('is_premium_location', e.target.checked)}
                    />{' '}
                    Premium Location
                  </label>
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="External Features">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Num label="Number of Cars" k="number_of_cars" />
                <CheckRow>
                  <Check label="Private Garden" k="has_private_garden" />
                  <Check label="Private Pool" k="has_private_pool" />
                  <Check label="Terrace" k="has_terrace" />
                  <Check label="Compound Wall" k="has_compound_wall" />
                  <Check label="Gate" k="has_gate" />
                  <Check label="EV Charging" k="has_ev_charging" />
                </CheckRow>
              </div>
            </SectionCard>
          </>
        );

      case 'house_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="House Number" k="house_number" />
                <Text label="House Type" k="house_type" />
                <Text label="BHK" k="bhk" />
              </div>
            </SectionCard>
            <SectionCard title="Configuration">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Bedrooms</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.bedrooms ?? ''}
                    onChange={(e) =>
                      set('bedrooms', e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Bathrooms</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.bathrooms ?? ''}
                    onChange={(e) =>
                      set('bathrooms', e.target.value === '' ? null : parseInt(e.target.value, 10))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Total Floors</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.total_floors ?? ''}
                    onChange={(e) =>
                      set(
                        'total_floors',
                        e.target.value === '' ? null : parseInt(e.target.value, 10),
                      )
                    }
                  />
                </div>
                <CheckRow>
                  <Check label="Kitchen" k="has_kitchen" />
                  <Check label="Pooja Room" k="has_pooja_room" />
                  <Check label="Study Room" k="has_study_room" />
                  <Check label="Servant Room" k="has_servant_room" />
                  <Check label="Utility Room" k="has_utility_room" />
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Area">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Plot Area (Sq.Yd)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_area_sqyd ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_area_sqyd',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Ground Floor Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.ground_floor_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'ground_floor_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>First Floor Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.first_floor_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'first_floor_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Garden Area (sqft)" k="garden_area" />
                <Num label="Terrace Area (sqft)" k="terrace_area" />
              </div>
            </SectionCard>
            <SectionCard title="Position">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_corner}
                      onChange={(e) => set('is_corner', e.target.checked)}
                    />{' '}
                    Corner House
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_park_facing}
                      onChange={(e) => set('is_park_facing', e.target.checked)}
                    />{' '}
                    Park Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_road_facing}
                      onChange={(e) => set('is_road_facing', e.target.checked)}
                    />{' '}
                    Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_main_road_facing}
                      onChange={(e) => set('is_main_road_facing', e.target.checked)}
                    />{' '}
                    Main Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_premium_location}
                      onChange={(e) => set('is_premium_location', e.target.checked)}
                    />{' '}
                    Premium Location
                  </label>
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Parking">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Num label="Parking Capacity" k="parking_capacity" />
                <Text label="Parking Number" k="parking_number" />
                <CheckRow>
                  <Check label="Covered Parking" k="is_covered_parking" />
                  <Check label="Additional Parking" k="has_additional_parking" />
                </CheckRow>
              </div>
            </SectionCard>
          </>
        );

      case 'commercial_shop_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Shop Number" k="shop_number" />
                <Text label="Building" k="building" />
                <Text label="Block" k="block" />
                <Text label="Floor" k="floor" />
                <Text label="Shop Type" k="shop_type" />
              </div>
            </SectionCard>
            <SectionCard title="Area">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Carpet Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.carpet_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'carpet_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Super Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.super_built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'super_built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Frontage (ft)" k="frontage" />
                <Num label="Depth (ft)" k="depth" />
                <Num label="Ceiling Height (ft)" k="ceiling_height" />
              </div>
            </SectionCard>
            <SectionCard title="Location">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_corner}
                      onChange={(e) => set('is_corner', e.target.checked)}
                    />{' '}
                    Corner Shop
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_main_road_facing}
                      onChange={(e) => set('is_main_road_facing', e.target.checked)}
                    />{' '}
                    Main Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_road_facing}
                      onChange={(e) => set('is_road_facing', e.target.checked)}
                    />{' '}
                    Road Facing
                  </label>
                  <Check label="Entrance Facing" k="is_entrance_facing" />
                  <Check label="Mall Facing" k="is_mall_facing" />
                  <Check label="Parking Facing" k="is_parking_facing" />
                  <Check label="High Footfall Location" k="is_high_footfall_location" />
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_premium_location}
                      onChange={(e) => set('is_premium_location', e.target.checked)}
                    />{' '}
                    Premium Location
                  </label>
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Facilities">
              <CheckRow>
                <Check label="Parking" k="has_parking" />
                <Check label="Power" k="has_power" />
                <Check label="Water" k="has_water" />
                <Check label="Washroom" k="has_washroom" />
                <Check label="Lift" k="has_lift" />
                <Check label="Security" k="has_security" />
                <Check label="Fire Safety" k="has_fire_safety" />
                <Check label="Signage Space" k="has_signage_space" />
              </CheckRow>
            </SectionCard>
          </>
        );

      case 'commercial_office_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Office Number" k="office_number" />
                <Text label="Tower" k="tower" />
                <Text label="Floor" k="floor" />
                <Text label="Block" k="block" />
                <Text label="Office Type" k="office_type" />
              </div>
            </SectionCard>
            <SectionCard title="Area">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Carpet Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.carpet_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'carpet_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Super Built-up Area (sqft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.super_built_up_area_sqft ?? ''}
                    onChange={(e) =>
                      set(
                        'super_built_up_area_sqft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Configuration">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Num label="Cabins" k="cabins" />
                <Num label="Workstations" k="workstations" />
                <Num label="Meeting Rooms" k="meeting_rooms" />
                <Num label="Washrooms" k="washrooms" />
                <CheckRow>
                  <Check label="Reception" k="has_reception" />
                  <Check label="Pantry" k="has_pantry" />
                  <Check label="Server Room" k="has_server_room" />
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Position">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_corner}
                      onChange={(e) => set('is_corner', e.target.checked)}
                    />{' '}
                    Corner
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_road_facing}
                      onChange={(e) => set('is_road_facing', e.target.checked)}
                    />{' '}
                    Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_main_road_facing}
                      onChange={(e) => set('is_main_road_facing', e.target.checked)}
                    />{' '}
                    Main Road Facing
                  </label>
                  <Check label="City View" k="is_city_view" />
                  <Check label="Higher Floor" k="is_higher_floor" />
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_premium_location}
                      onChange={(e) => set('is_premium_location', e.target.checked)}
                    />{' '}
                    Premium Location
                  </label>
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Facilities">
              <CheckRow>
                <Check label="Parking" k="has_parking" />
                <Check label="Power Backup" k="has_power_backup" />
                <Check label="Lift" k="has_lift" />
                <Check label="Security" k="has_security" />
                <Check label="Fire Safety" k="has_fire_safety" />
                <Check label="HVAC" k="has_hvac" />
                <Check label="Internet" k="has_internet" />
                <Check label="EV Charging" k="has_ev_charging" />
              </CheckRow>
            </SectionCard>
          </>
        );

      case 'farm_land_details':
        return (
          <>
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Text label="Farm Land Number" k="farm_land_number" />
                <Text label="Parcel Number" k="parcel_number" />
                <Text label="Survey Number" k="survey_number" />
                <Text label="Subdivision" k="subdivision" />
              </div>
            </SectionCard>
            <SectionCard title="Land Details">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel required>Total Area</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.area_value ?? ''}
                    onChange={(e) =>
                      set('area_value', e.target.value === '' ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Area Unit</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.area_unit || 'ACRE'}
                    onChange={(e) => set('area_unit', e.target.value as any)}
                  >
                    <option value="ACRE">Acres</option>
                    <option value="GUNTA">Guntas</option>
                    <option value="SQYD">Sq.Yards</option>
                    <option value="SQFT">Sq.Ft.</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Length (ft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_length_ft ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_length_ft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Width (ft)</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.plot_width_ft ?? ''}
                    onChange={(e) =>
                      set(
                        'plot_width_ft',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
                <Num label="Road Frontage (ft)" k="road_frontage" />
                <div className="col-span-2 md:col-span-1">
                  <FieldLabel>Boundary Details</FieldLabel>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={detail.boundary_details || ''}
                    onChange={(e) => setDetail('boundary_details', e.target.value)}
                  />
                </div>
              </div>
            </SectionCard>
            <SectionCard title="Location">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Facing</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.facing || ''}
                    onChange={(e) => set('facing', e.target.value || null)}
                  >
                    <option value="">Not specified</option>
                    {FACING_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
                <CheckRow>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_road_facing}
                      onChange={(e) => set('is_road_facing', e.target.checked)}
                    />{' '}
                    Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_main_road_facing}
                      onChange={(e) => set('is_main_road_facing', e.target.checked)}
                    />{' '}
                    Main Road Facing
                  </label>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_corner}
                      onChange={(e) => set('is_corner', e.target.checked)}
                    />{' '}
                    Corner
                  </label>
                  <Check label="Near Water Source" k="is_near_water_source" />
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={!!form.is_premium_location}
                      onChange={(e) => set('is_premium_location', e.target.checked)}
                    />{' '}
                    Premium Location
                  </label>
                </CheckRow>
              </div>
            </SectionCard>
            <SectionCard title="Infrastructure">
              <CheckRow>
                <Check label="Internal Road" k="has_internal_road" />
                <Check label="Electricity" k="has_electricity" />
                <Check label="Water" k="has_water" />
                <Check label="Borewell" k="has_borewell" />
                <Check label="Irrigation" k="has_irrigation" />
                <Check label="Fencing" k="has_fencing" />
                <Check label="Plantation" k="has_plantation" />
                <Check label="Drainage" k="has_drainage" />
                <Check label="Farmhouse Permission" k="has_farmhouse_permission" />
              </CheckRow>
            </SectionCard>
          </>
        );
    }
  };

  const currentStep = STEPS[step];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] animate-scaleUp">
        <div className="p-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-black text-slate-800">
                {mode === 'create' ? 'Add Property' : `Edit ${property?.property_code}`}
              </h2>
              <p className="text-xs text-slate-500">
                Step {step + 1} of {STEPS.length}: {currentStep}
              </p>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {STEPS.map((s, i) => (
              <button
                key={s}
                onClick={() => i < step && setStep(i)}
                disabled={i > step}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-colors ${i === step ? 'bg-navy-700 text-white' : i < step ? 'bg-navy-50 text-navy-700 hover:bg-navy-100' : 'bg-slate-50 text-slate-300'}`}
              >
                {i + 1}. {s}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5 flex-1">
          {currentStep === 'Category' && (
            <SectionCard
              title="Category"
              subtitle="Each type gets its own fields on the next steps, matching how this business actually describes a plot vs. a flat vs. a villa."
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PROPERTY_CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => set('category', c.id as PropertyCategory)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-colors flex items-center gap-1.5 ${form.category === c.id ? 'bg-navy-700 text-white border-navy-700' : 'bg-white border-slate-200 text-slate-600 hover:border-navy-300'}`}
                  >
                    <c.icon className="w-3.5 h-3.5 shrink-0" /> {c.label}
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {currentStep === 'Basic Details' && (
            <SectionCard title="Basic Details">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <FieldLabel required>Title</FieldLabel>
                  <input
                    className={inputCls}
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="3BHK Villa in Kondapur"
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    className={inputCls}
                    rows={3}
                    value={form.description || ''}
                    onChange={(e) => set('description', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Brand</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.brand_type}
                    onChange={(e) => set('brand_type', e.target.value as any)}
                  >
                    <option value="SONTHILLU">Sonthillu (Residential)</option>
                    <option value="RADHA_REAL_HOMES">Radha Real Homes (Commercial/Plots)</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Listing Type</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.listing_type || 'NEW'}
                    onChange={(e) => set('listing_type', e.target.value as any)}
                  >
                    <option value="NEW">New</option>
                    <option value="RESALE">Resale</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Possession</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.possession_status || ''}
                    onChange={(e) => set('possession_status', (e.target.value || null) as any)}
                  >
                    <option value="">Not specified</option>
                    <option value="READY_TO_MOVE">Ready to Move</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                  </select>
                </div>
              </div>
            </SectionCard>
          )}

          {currentStep === 'Location' && (
            <SectionCard
              title="Location"
              subtitle="A standalone property owns its own address (unlike a project unit, which inherits its project's)."
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <FieldLabel>Pincode</FieldLabel>
                  <div className="flex gap-2">
                    <input
                      className={inputCls}
                      value={form.pincode || ''}
                      onChange={(e) => set('pincode', e.target.value)}
                      maxLength={6}
                    />
                    <button
                      onClick={handlePincodeLookup}
                      disabled={isLookingUp}
                      className="px-3 bg-navy-50 hover:bg-navy-100 text-navy-700 rounded-xl border border-navy-100 shrink-0"
                    >
                      {isLookingUp ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPinned className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <input
                    className={inputCls}
                    value={form.state || ''}
                    onChange={(e) => set('state', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <input
                    className={inputCls}
                    value={form.city || ''}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Locality</FieldLabel>
                  <input
                    className={inputCls}
                    value={form.locality || ''}
                    onChange={(e) => set('locality', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <FieldLabel required>Location (display)</FieldLabel>
                  <input
                    className={inputCls}
                    value={form.location}
                    onChange={(e) => set('location', e.target.value)}
                    placeholder="Kondapur, Hyderabad"
                  />
                </div>
                <div className="col-span-3">
                  <FieldLabel>Address</FieldLabel>
                  <textarea
                    className={inputCls}
                    rows={2}
                    value={form.address || ''}
                    onChange={(e) => set('address', e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Latitude</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.latitude ?? ''}
                    onChange={(e) =>
                      set('latitude', e.target.value === '' ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Longitude</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.longitude ?? ''}
                    onChange={(e) =>
                      set('longitude', e.target.value === '' ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {currentStep === 'Size & Details' && (
            <div className="space-y-4">
              <div className="max-w-xs">
                <FieldLabel required>Area (sqft, overall)</FieldLabel>
                <input
                  className={inputCls}
                  type="number"
                  value={form.area_sqft || ''}
                  onChange={(e) => set('area_sqft', parseFloat(e.target.value) || 0)}
                />
              </div>
              {renderCategoryDetails()}
              <SectionCard title="Amenities">
                <FieldLabel>Amenities (comma-separated)</FieldLabel>
                <input
                  className={inputCls}
                  value={form.amenities || ''}
                  onChange={(e) => set('amenities', e.target.value)}
                  placeholder="Swimming Pool, Club House, 24/7 Security"
                />
              </SectionCard>
            </div>
          )}

          {currentStep === 'Pricing' && (
            <SectionCard
              title="Pricing"
              subtitle="Base price + additional charges, exactly like the dynamic Extra Charges system in the property spec — add as many charges as this property needs, each with its own amount."
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <FieldLabel>Price Basis</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.price_basis || ''}
                    onChange={(e) => set('price_basis', e.target.value as any)}
                  >
                    <option value="SUPER_BUILT_UP">Super Built-up</option>
                    <option value="BUILT_UP">Built-up</option>
                    <option value="CARPET">Carpet</option>
                    <option value="PLOT_AREA">Plot Area (Sq.Yd)</option>
                    <option value="LUMPSUM">Lump Sum</option>
                  </select>
                </div>
                <div>
                  <FieldLabel required>Base Rate</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.base_rate ?? ''}
                    onChange={(e) =>
                      set('base_rate', e.target.value === '' ? null : parseFloat(e.target.value))
                    }
                  />
                </div>
                <div>
                  <FieldLabel>Rate Unit</FieldLabel>
                  <select
                    className={selectCls}
                    value={form.base_rate_unit || 'PER_SQFT'}
                    onChange={(e) => set('base_rate_unit', e.target.value as ChargeCalcMethod)}
                  >
                    <option value="PER_SQFT">₹ per Sq.Ft</option>
                    <option value="PER_SQYD">₹ per Sq.Yd</option>
                    <option value="FIXED">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Discount</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={form.discount_amount ?? ''}
                    onChange={(e) =>
                      set(
                        'discount_amount',
                        e.target.value === '' ? null : parseFloat(e.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <p className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                Additional Charges (Premiums / PLC / Development / Registration...)
              </p>
              <div className="space-y-2 mb-3">
                {(form.manual_lines || []).map((line, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      className={inputCls + ' flex-1'}
                      placeholder="e.g. East Facing Premium, Corner Premium, Development Charges"
                      value={line.label}
                      onChange={(e) => updateManualLine(i, { label: e.target.value })}
                    />
                    <input
                      className={inputCls + ' w-32'}
                      type="number"
                      placeholder="Amount"
                      value={line.amount || ''}
                      onChange={(e) =>
                        updateManualLine(i, { amount: parseFloat(e.target.value) || 0 })
                      }
                    />
                    <button
                      onClick={() => removeManualLine(i)}
                      className="p-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addManualLine}
                  className="flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:text-navy-900"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Charge
                </button>
              </div>

              {(form.base_rate || (form.manual_lines || []).length > 0) && (
                <div className="p-3 bg-navy-50/50 border border-navy-100 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Base ({form.base_rate_unit === 'PER_SQYD' ? 'Sq.Yd' : 'Sq.Ft'} rate)
                    </span>
                    <span className="font-semibold">₹{preview.base.toLocaleString('en-IN')}</span>
                  </div>
                  {preview.manual > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Additional charges</span>
                      <span className="font-semibold">
                        ₹{preview.manual.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                  {preview.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount</span>
                      <span>−₹{preview.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-navy-900 pt-1 border-t border-navy-200">
                    <span>Estimated Total</span>
                    <span>₹{preview.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {mode === 'edit' && property && (property.price_lines?.length ?? 0) > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                    Last computed (server-side)
                  </p>
                  <CostSheet
                    computation={{
                      lines: property.price_lines as any,
                      base_price: property.base_price,
                      premiums_total: property.premiums_total,
                      charges_total: property.charges_total,
                      discount_amount: 0,
                      calculated_price: property.calculated_price,
                      taxes_total: property.taxes_total,
                      all_inclusive_price: property.calculated_price + property.taxes_total,
                      refundable_total: 0,
                      warnings: [],
                    }}
                    finalPrice={property.final_price}
                  />
                </div>
              )}
            </SectionCard>
          )}

          {currentStep === 'Photos' && (
            <SectionCard
              title="Photos"
              subtitle="Add listing photos and choose a cover image now — these are what buyers see, separate from the on-site verification photos a PM uploads later."
            >
              <div className="space-y-4">
                <div className="relative w-fit">
                  <input
                    type="file"
                    id="property-photo-upload"
                    accept="image/*"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      mode === 'create'
                        ? stageFiles(e.target.files)
                        : handleUploadExisting(e.target.files);
                      e.target.value = '';
                    }}
                    disabled={imageBusy}
                  />
                  <label
                    htmlFor="property-photo-upload"
                    className="flex items-center gap-2 px-4 py-2.5 bg-navy-700 hover:bg-navy-800 text-white font-bold text-sm rounded-xl cursor-pointer transition-colors"
                  >
                    {imageBusy ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}{' '}
                    Upload Photos
                  </label>
                </div>

                {mode === 'create' ? (
                  stagedImages.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {stagedImages.map((img, i) => (
                        <div
                          key={img.preview}
                          className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square shadow-sm"
                        >
                          <img src={img.preview} alt="" className="w-full h-full object-cover" />
                          {i === stagedCoverIndex && (
                            <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Star className="w-2.5 h-2.5" /> COVER
                            </div>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                            {i !== stagedCoverIndex && (
                              <button
                                type="button"
                                onClick={() => setStagedCoverIndex(i)}
                                className="p-2 bg-white text-amber-600 rounded-full hover:bg-amber-50 shadow-md"
                                title="Set as cover"
                              >
                                <Star className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeStagedImage(i)}
                              className="p-2 bg-white text-rose-600 rounded-full hover:bg-rose-50 shadow-md"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                      <Camera className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-400 text-sm">No photos added yet</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Photos are optional but strongly recommended — the first one you add becomes
                        the cover unless you pick another.
                      </p>
                    </div>
                  )
                ) : existingImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {existingImages.map((img) => (
                      <div
                        key={img.id}
                        className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square shadow-sm"
                      >
                        <img
                          src={resolveImageUrl(img.image_url)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {img.is_primary && (
                          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star className="w-2.5 h-2.5" /> COVER
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                          {!img.is_primary && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryExisting(img.id)}
                              disabled={imageBusy}
                              className="p-2 bg-white text-amber-600 rounded-full hover:bg-amber-50 shadow-md disabled:opacity-50"
                              title="Set as cover"
                            >
                              <Star className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteExisting(img.id)}
                            disabled={imageBusy}
                            className="p-2 bg-white text-rose-600 rounded-full hover:bg-rose-50 shadow-md disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Camera className="w-9 h-9 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-400 text-sm">No photos uploaded yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload high-quality photos to attract more buyers.
                    </p>
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {currentStep === 'Review' && (
            <SectionCard title="Review" subtitle="Confirm the details before submitting.">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category</span>
                  <span className="font-bold text-slate-800">
                    {PROPERTY_CATEGORIES.find((c) => c.id === form.category)?.label}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Title</span>
                  <span className="font-bold text-slate-800">{form.title || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Estimated Price</span>
                  <span className="font-bold text-slate-800">
                    ₹{preview.total.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location</span>
                  <span className="font-bold text-slate-800">{form.location || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Area</span>
                  <span className="font-bold text-slate-800">{form.area_sqft || 0} sqft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Photos</span>
                  <span className="font-bold text-slate-800">
                    {mode === 'create' ? stagedImages.length : existingImages.length}
                  </span>
                </div>
                {(form.base_rate || (form.manual_lines || []).length > 0) && (
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-400">Estimated Cost Sheet Total</span>
                    <span className="font-black text-navy-800">
                      ₹{preview.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>
            </SectionCard>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50/80 flex justify-between gap-2 shrink-0">
          <div>
            {step > 0 && (
              <button
                onClick={goBack}
                className="flex items-center gap-1.5 px-4 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl text-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl text-sm"
            >
              Cancel
            </button>
            {step < STEPS.length - 1 ? (
              <button
                onClick={goNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl shadow-lg text-sm"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-navy-700 hover:bg-navy-800 text-white font-bold rounded-xl shadow-lg disabled:opacity-60 text-sm"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />{' '}
                    {mode === 'create' ? 'Submit Property' : 'Save Changes'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
