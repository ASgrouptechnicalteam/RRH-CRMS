import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../common/ui/Button';
import { InputField } from '../common/ui/InputField';
import { SelectField } from '../common/ui/SelectField';
import { PROPERTY_TYPE_OPTIONS } from '../../constants/propertyTypes';

export interface QualificationData {
  budget_min?: number;
  budget_max?: number;
  property_type_preference?: string;
  preferred_location?: string;
}

interface QualificationFormModalProps {
  title?: string;
  initialData?: QualificationData;
  requireAllFields?: boolean;
  onSave: (data: QualificationData) => Promise<void>;
  onClose: () => void;
}

export const QualificationFormModal: React.FC<QualificationFormModalProps> = ({
  title = 'Lead Qualification',
  initialData,
  requireAllFields = false,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<QualificationData>({
    budget_min: initialData?.budget_min || undefined,
    budget_max: initialData?.budget_max || undefined,
    property_type_preference: initialData?.property_type_preference || '',
    preferred_location: initialData?.preferred_location || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (requireAllFields) {
      if (!formData.budget_min) newErrors.budget_min = 'Min budget is required';
      if (!formData.budget_max) newErrors.budget_max = 'Max budget is required';
      if (!formData.property_type_preference) newErrors.property_type_preference = 'Property type is required';
      if (!formData.preferred_location) newErrors.preferred_location = 'Preferred location is required';
    }

    if (formData.budget_min && formData.budget_max) {
      if (formData.budget_max < formData.budget_min) {
        newErrors.budget_max = 'Max budget cannot be less than Min budget';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    setApiError(null);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Failed to save qualification details');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-navy-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {apiError && (
            <div className="mb-4 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm border border-rose-200">
              {apiError}
            </div>
          )}

          <form id="qualification-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Min Budget (₹)"
                type="number"
                value={formData.budget_min || ''}
                onChange={(e) => setFormData({ ...formData, budget_min: Number(e.target.value) || undefined })}
                error={errors.budget_min}
              />
              <InputField
                label="Max Budget (₹)"
                type="number"
                value={formData.budget_max || ''}
                onChange={(e) => setFormData({ ...formData, budget_max: Number(e.target.value) || undefined })}
                error={errors.budget_max}
              />
            </div>

            <SelectField
              label="Property Type Preference"
              value={formData.property_type_preference || ''}
              onChange={(e) => setFormData({ ...formData, property_type_preference: e.target.value })}
              error={errors.property_type_preference}
            >
              <option value="">Select property type...</option>
              {PROPERTY_TYPE_OPTIONS.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
              {/* Support legacy/unknown values if they are already set in DB */}
              {formData.property_type_preference && !PROPERTY_TYPE_OPTIONS.find(pt => pt.value === formData.property_type_preference) && (
                <option value={formData.property_type_preference}>{formData.property_type_preference}</option>
              )}
            </SelectField>

            <InputField
              label="Preferred Location"
              type="text"
              placeholder="e.g., Gachibowli, Hyderabad"
              value={formData.preferred_location || ''}
              onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
              error={errors.preferred_location}
            />
          </form>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="qualification-form" variant="primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save & Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
};
