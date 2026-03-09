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
          <FieldLabel>策略名称</FieldLabel>
          <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </Field>

        <Field>
          <FieldLabel>描述</FieldLabel>
          <Textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            placeholder="策略描述..."
          />
        </Field>
      </FieldGroup>

      <FieldSet className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <FieldLegend variant="label">配额限制</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel>限制类型</FieldLabel>
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
                <SelectValue placeholder="选择限制类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="token">Token 限制</SelectItem>
                <SelectItem value="request">请求次数限制</SelectItem>
              </SelectContent>
            </Select>
            <FieldDescription>
              {formData.limitType === 'token'
                ? '限制每日使用的 Token 数量'
                : '限制每日请求次数（不限制 Token）'}
            </FieldDescription>
          </Field>

          {formData.limitType === 'token' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel>每日 Token 上限</FieldLabel>
                <Input
                  type="number"
                  name="dailyTokenLimit"
                  value={formData.dailyTokenLimit || ''}
                  onChange={handleChange}
                  required
                  placeholder="例如: 5000"
                />
              </Field>
              <Field>
                <FieldLabel>每月 Token 上限</FieldLabel>
                <Input
                  type="number"
                  name="monthlyTokenLimit"
                  value={formData.monthlyTokenLimit || ''}
                  onChange={handleChange}
                  placeholder="例如: 50000（可选）"
                />
              </Field>
            </div>
          )}

          {formData.limitType === 'request' && (
            <Field>
              <FieldLabel>每日请求次数上限</FieldLabel>
              <Input
                type="number"
                name="dailyRequestLimit"
                value={formData.dailyRequestLimit || ''}
                onChange={handleChange}
                required
                placeholder="例如: 1000"
              />
            </Field>
          )}

          <Field>
            <FieldLabel>每分钟请求次数 (RPM)</FieldLabel>
            <Input
              type="number"
              name="rpmLimit"
              value={formData.rpmLimit}
              onChange={handleChange}
              required
            />
          </Field>
        </FieldGroup>
      </FieldSet>

      <div className="flex space-x-3 pt-4">
        <Button type="submit">保存</Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>
    </form>
  );
};

export default PolicyForm;
