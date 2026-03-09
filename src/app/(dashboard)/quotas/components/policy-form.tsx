'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const inputClassName =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          策略名称
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className={inputClassName}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className={inputClassName}
          placeholder="策略描述..."
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">配额限制</h3>

        {/* 限制类型选择 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            限制类型
          </label>
          <Select
            value={formData.limitType}
            onValueChange={(value: 'token' | 'request') => {
              setFormData({
                ...formData,
                limitType: value,
                // 切换类型时清空另一种类型的值
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
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {formData.limitType === 'token'
              ? '限制每日使用的 Token 数量'
              : '限制每日请求次数（不限制 Token）'}
          </p>
        </div>

        {/* Token 限制模式 */}
        {formData.limitType === 'token' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                每日 Token 上限
              </label>
              <input
                type="number"
                name="dailyTokenLimit"
                value={formData.dailyTokenLimit || ''}
                onChange={handleChange}
                required
                className={inputClassName}
                placeholder="例如: 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                每月 Token 上限
              </label>
              <input
                type="number"
                name="monthlyTokenLimit"
                value={formData.monthlyTokenLimit || ''}
                onChange={handleChange}
                className={inputClassName}
                placeholder="例如: 50000（可选）"
              />
            </div>
          </div>
        )}

        {/* 请求次数限制模式 */}
        {formData.limitType === 'request' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              每日请求次数上限
            </label>
            <input
              type="number"
              name="dailyRequestLimit"
              value={formData.dailyRequestLimit || ''}
              onChange={handleChange}
              required
              className={inputClassName}
              placeholder="例如: 1000"
            />
          </div>
        )}

        {/* RPM 限制（两种模式都有） */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            每分钟请求次数 (RPM)
          </label>
          <input
            type="number"
            name="rpmLimit"
            value={formData.rpmLimit}
            onChange={handleChange}
            required
            className={inputClassName}
          />
        </div>
      </div>

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
