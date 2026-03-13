'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from '@/components/ui/field';
import { useTranslation } from '@/i18n/client';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  limitType: 'token' | 'request';
  dailyTokenLimit?: number;
  monthlyTokenLimit?: number;
  dailyRequestLimit?: number;
  rpmLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PolicyFormProps {
  policy: QuotaPolicy | null;
  onSave: (policy: Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PolicyForm: React.FC<PolicyFormProps> = (props) => {
  const { policy, onSave, onCancel } = props;
  const { t } = useTranslation();
  const [formData, setFormData] = React.useState<
    Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>
  >(
    policy
      ? {
          name: policy.name,
          description: policy.description || '',
          limitType: policy.limitType,
          dailyTokenLimit: policy.dailyTokenLimit,
          monthlyTokenLimit: policy.monthlyTokenLimit,
          dailyRequestLimit: policy.dailyRequestLimit,
          rpmLimit: policy.rpmLimit,
        }
      : {
          name: '',
          description: undefined,
          limitType: 'token',
          dailyTokenLimit: 5000,
          monthlyTokenLimit: 50000,
          rpmLimit: 60,
        }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'description') {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: Number(value) });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FieldGroup>
        <Field>
          <FieldLabel>{t('Quota.name') as string}</FieldLabel>
          <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </Field>

        <Field>
          <FieldLabel>{t('Quota.description') as string}</FieldLabel>
          <Textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            placeholder={t('Quota.descriptionPlaceholder') as string}
          />
        </Field>
      </FieldGroup>

      <FieldSet className="border-t border-white/20 dark:border-white/10 pt-4">
        <FieldLegend variant="label">{t('Common.quotaLimit') as string}</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>{t('Quota.limitType') as string}</FieldLabel>
            <Select
              value={formData.limitType}
              onValueChange={(value: 'token' | 'request') => {
                setFormData({
                  ...formData,
                  limitType: value,
                  dailyTokenLimit: value === 'token' ? formData.dailyTokenLimit || 5000 : undefined,
                  monthlyTokenLimit:
                    value === 'token' ? formData.monthlyTokenLimit || 50000 : undefined,
                  dailyRequestLimit:
                    value === 'request' ? formData.dailyRequestLimit || 1000 : undefined,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('Quota.limitTypePlaceholder') as string} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="token">{t('Quota.tokenLimit') as string}</SelectItem>
                <SelectItem value="request">{t('Quota.requestLimit') as string}</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              {
                (formData.limitType === 'token'
                  ? t('Quota.tokenLimitDesc')
                  : t('Quota.requestLimitDesc')) as string
              }
            </FieldDescription>
          </Field>

          {formData.limitType === 'token' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>{t('Quota.dailyTokenLimit') as string}</FieldLabel>
                <Input
                  type="number"
                  name="dailyTokenLimit"
                  value={formData.dailyTokenLimit || ''}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5000"
                />
              </Field>
              <Field>
                <FieldLabel>{t('Quota.monthlyTokenLimit') as string}</FieldLabel>
                <Input
                  type="number"
                  name="monthlyTokenLimit"
                  value={formData.monthlyTokenLimit || ''}
                  onChange={handleChange}
                  placeholder="e.g. 50000 (optional)"
                />
              </Field>
            </div>
          )}

          {formData.limitType === 'request' && (
            <Field>
              <FieldLabel>{t('Quota.dailyRequestLimit') as string}</FieldLabel>
              <Input
                required
                type="number"
                name="dailyRequestLimit"
                value={formData.dailyRequestLimit || ''}
                placeholder="e.g. 1000"
                onChange={handleChange}
              />
            </Field>
          )}

          <Field>
            <FieldLabel>{t('Quota.rpmLimit') as string}</FieldLabel>
            <Input
              type="number"
              name="rpmLimit"
              value={formData.rpmLimit}
              required
              onChange={handleChange}
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className="flex space-x-3 pt-4">
        <Button type="submit">{t('Quota.save') as string}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('Quota.cancel') as string}
        </Button>
      </div>
    </form>
  );
};

export default PolicyForm;
