import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SectionCard, FieldLabel, inputCls, selectCls } from './propertyWizardShared';
import {
  listPropertyPricingRules,
  createPropertyPricingRule,
  deletePropertyPricingRule,
  previewPropertyPrice,
  PropertyPricingRule,
  PropertyPricingRuleInput,
  PropertyPriceComputation,
} from '../../api/properties';
import { ChargeCategory, ChargeCalcMethod, PricingRuleKind } from '../../api/projectUnits';

// § Phase 3: a standalone Property's own conditional pricing rules — mirrors
// projects/PricingRulesPanel.tsx's rule builder, minus applies_to_unit_type
// (a property already has one fixed category) and floor matching (no
// top-level numeric floor field on Property). Since a property is a single,
// already-fixed unit (not a template pricing many varied ones), the "sample
// unit calculator" from the Project version is replaced by a direct preview
// against the property's own real stored attributes.

const RULE_CATEGORIES: { value: ChargeCategory; label: string }[] = [
  { value: 'FACING', label: 'Facing' },
  { value: 'CORNER', label: 'Corner' },
  { value: 'ROAD', label: 'Road-Facing' },
  { value: 'PARK', label: 'Park-Facing' },
  { value: 'VIEW', label: 'View' },
  { value: 'AMENITY', label: 'Amenity' },
  { value: 'PARKING', label: 'Parking' },
  { value: 'INFRA', label: 'Infrastructure (EDC/IDC)' },
  { value: 'MAINTENANCE', label: 'Maintenance (IFMS)' },
  { value: 'LEGAL', label: 'Legal / Documentation' },
  { value: 'CLUB', label: 'Club House' },
  { value: 'TAX', label: 'Tax (GST/Registration)' },
  { value: 'OTHER', label: 'Other' },
];

const CALC_METHODS: { value: ChargeCalcMethod; label: string }[] = [
  { value: 'PER_SQFT', label: '₹ per Sq.Ft' },
  { value: 'PER_SQYD', label: '₹ per Sq.Yd' },
  { value: 'FIXED', label: 'Fixed Amount' },
  { value: 'PERCENT_OF_BASE', label: '% of Base Price' },
  { value: 'QTY_X_RATE', label: 'Quantity × Rate' },
];

const FACING_OPTIONS = [
  'EAST',
  'WEST',
  'NORTH',
  'SOUTH',
  'NORTH_EAST',
  'NORTH_WEST',
  'SOUTH_EAST',
  'SOUTH_WEST',
];

function describeRule(r: PropertyPricingRule): string {
  const amount =
    r.calc_method === 'PERCENT_OF_BASE'
      ? `${r.rate}% of base`
      : r.calc_method === 'FIXED'
        ? `₹${r.rate.toLocaleString('en-IN')} fixed`
        : `₹${r.rate.toLocaleString('en-IN')} / ${r.calc_method === 'PER_SQYD' ? 'Sq.Yd' : r.calc_method === 'PER_SQFT' ? 'Sq.Ft' : 'unit'}`;
  const conditions = [
    r.match_facing ? `${r.match_facing.replace(/_/g, '-')} facing only` : null,
    r.match_corner ? 'Corner only' : null,
    r.match_park_facing ? 'Park-facing only' : null,
    r.match_road_facing ? 'Road-facing only' : null,
    r.is_active === false ? 'Inactive' : null,
  ].filter(Boolean);
  return conditions.length ? `${amount} • ${conditions.join(' • ')}` : amount;
}

export const PropertyPricingRulesPanel: React.FC<{ propertyId: number; readOnly?: boolean }> = ({
  propertyId,
  readOnly,
}) => {
  const { fetchWithAuth } = useAuth();
  const { showToast, showError } = useToast();

  const [rules, setRules] = useState<PropertyPricingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState<Partial<PropertyPricingRuleInput>>({
    kind: 'PREMIUM',
    calc_method: 'FIXED',
    category: 'OTHER',
  });
  const [computation, setComputation] = useState<PropertyPriceComputation | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const load = () => {
    setLoading(true);
    listPropertyPricingRules(fetchWithAuth, propertyId)
      .then(({ rules }) => setRules(rules))
      .catch(() => showError({ message: 'Failed to load pricing rules' }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [propertyId]); // eslint-disable-line react-hooks/exhaustive-deps

  const runPreview = () => {
    setPreviewLoading(true);
    previewPropertyPrice(fetchWithAuth, propertyId)
      .then(({ computation }) => setComputation(computation))
      .catch(() => showError({ message: 'Failed to preview price' }))
      .finally(() => setPreviewLoading(false));
  };

  const handleAddRule = async () => {
    if (!newRule.label || !newRule.rate) {
      showError({ message: 'Label and rate are required' });
      return;
    }
    try {
      const { rule } = await createPropertyPricingRule(
        fetchWithAuth,
        propertyId,
        newRule as PropertyPricingRuleInput,
      );
      setRules((r) => [...r, rule]);
      setShowAddRule(false);
      setNewRule({ kind: 'PREMIUM', calc_method: 'FIXED', category: 'OTHER' });
      showToast('Pricing rule added — recalculate to apply it', 'success');
    } catch (err: any) {
      showError({ message: err?.message || 'Failed to add pricing rule' });
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    try {
      await deletePropertyPricingRule(fetchWithAuth, propertyId, ruleId);
      setRules((r) => r.filter((x) => x.id !== ruleId));
      showToast('Rule deactivated — recalculate to apply it', 'success');
    } catch {
      showError({ message: 'Failed to remove rule' });
    }
  };

  const needsAreaBasis = newRule.calc_method === 'PER_SQFT' || newRule.calc_method === 'PER_SQYD';

  return (
    <div className="space-y-4">
      <SectionCard
        title="Property Pricing Rules"
        subtitle="Facing, corner, and other conditional premiums/charges — matched against this property's own stored attributes when you recalculate."
      >
        {loading ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading rules...
          </div>
        ) : (
          <div className="space-y-2">
            {rules.length === 0 && (
              <p className="text-xs text-slate-400 py-2">
                No rules yet. Manual charge lines above cover most one-off cases — use rules here
                for anything you'd rather manage as a structured line.
              </p>
            )}
            {rules.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl"
              >
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {r.label}{' '}
                    <span className="text-[10px] font-semibold text-slate-400 uppercase ml-1">
                      {r.kind}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">{describeRule(r)}</p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleDeleteRule(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!readOnly &&
          (showAddRule ? (
            <div className="mt-4 p-4 bg-navy-50/50 border border-navy-100 rounded-xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Label</FieldLabel>
                  <input
                    className={inputCls}
                    value={newRule.label || ''}
                    onChange={(e) => setNewRule((r) => ({ ...r, label: e.target.value }))}
                    placeholder="e.g. East Facing Premium"
                  />
                </div>
                <div>
                  <FieldLabel>Rule Type</FieldLabel>
                  <select
                    className={selectCls}
                    value={newRule.kind}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, kind: e.target.value as PricingRuleKind }))
                    }
                  >
                    <option value="PREMIUM">Premium</option>
                    <option value="CHARGE">Charge</option>
                    <option value="TAX">Tax</option>
                  </select>
                </div>
                <div>
                  <FieldLabel>Category</FieldLabel>
                  <select
                    className={selectCls}
                    value={newRule.category}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, category: e.target.value as ChargeCategory }))
                    }
                  >
                    {RULE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>Calculation</FieldLabel>
                  <select
                    className={selectCls}
                    value={newRule.calc_method}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, calc_method: e.target.value as ChargeCalcMethod }))
                    }
                  >
                    {CALC_METHODS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel required>Rate</FieldLabel>
                  <input
                    className={inputCls}
                    type="number"
                    value={newRule.rate ?? ''}
                    onChange={(e) =>
                      setNewRule((r) => ({ ...r, rate: parseFloat(e.target.value) }))
                    }
                  />
                </div>
                {needsAreaBasis && (
                  <div>
                    <FieldLabel>Area Basis</FieldLabel>
                    <select
                      className={selectCls}
                      value={newRule.area_basis || ''}
                      onChange={(e) =>
                        setNewRule((r) => ({ ...r, area_basis: e.target.value as any }))
                      }
                    >
                      <option value="">Use property's own basis</option>
                    </select>
                  </div>
                )}
                {newRule.category === 'FACING' && (
                  <div>
                    <FieldLabel>Applies to Facing</FieldLabel>
                    <select
                      className={selectCls}
                      value={newRule.match_facing || ''}
                      onChange={(e) =>
                        setNewRule((r) => ({ ...r, match_facing: e.target.value || null }))
                      }
                    >
                      <option value="">Any facing</option>
                      {FACING_OPTIONS.map((f) => (
                        <option key={f} value={f}>
                          {f.replace(/_/g, '-')}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {newRule.category === 'CORNER' && (
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!newRule.match_corner}
                        onChange={(e) =>
                          setNewRule((r) => ({ ...r, match_corner: e.target.checked }))
                        }
                      />
                      Only if this property is a corner unit
                    </label>
                  </div>
                )}
                {newRule.category === 'PARK' && (
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!newRule.match_park_facing}
                        onChange={(e) =>
                          setNewRule((r) => ({ ...r, match_park_facing: e.target.checked }))
                        }
                      />
                      Only if this property is park-facing
                    </label>
                  </div>
                )}
                {newRule.category === 'ROAD' && (
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={!!newRule.match_road_facing}
                        onChange={(e) =>
                          setNewRule((r) => ({ ...r, match_road_facing: e.target.checked }))
                        }
                      />
                      Only if this property is road-facing
                    </label>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddRule(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddRule}
                  className="px-4 py-1.5 text-xs font-black bg-navy-700 hover:bg-navy-800 text-white rounded-lg"
                >
                  Add Rule
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddRule(true)}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:text-navy-900"
            >
              <Plus className="w-3.5 h-3.5" /> Add Pricing Rule
            </button>
          ))}
      </SectionCard>

      <SectionCard
        title="Live Preview"
        subtitle="What this property would compute to right now, against its own facing/corner/etc. and the rules above — server-computed, not an estimate."
      >
        <button
          onClick={runPreview}
          disabled={previewLoading}
          className="flex items-center gap-1.5 text-xs font-bold text-navy-700 hover:text-navy-900 disabled:opacity-50"
        >
          {previewLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}{' '}
          {previewLoading ? 'Calculating...' : 'Run Preview'}
        </button>
        {computation && (
          <div className="border-t border-slate-100 pt-3 mt-3 space-y-1.5">
            {computation.lines.map((l, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className="text-slate-500">
                  {l.label}
                  {l.quantity !== 1
                    ? ` (${l.quantity.toLocaleString('en-IN')} × ₹${l.rate.toLocaleString('en-IN')})`
                    : ''}
                </span>
                <span className="font-semibold text-slate-700">
                  ₹{l.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-black text-navy-800 pt-2 border-t border-slate-100 mt-2">
              <span>Calculated Price</span>
              <span>₹{computation.calculated_price.toLocaleString('en-IN')}</span>
            </div>
            {computation.taxes_total > 0 && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>+ Taxes</span>
                <span>₹{computation.taxes_total.toLocaleString('en-IN')}</span>
              </div>
            )}
            {computation.warnings.map((w, i) => (
              <p key={i} className="text-[11px] text-amber-600">
                {w}
              </p>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};
