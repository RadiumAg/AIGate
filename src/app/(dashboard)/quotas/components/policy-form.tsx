'use client';

import React, { FC } from 'react';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
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

const PolicyForm: FC<PolicyFormProps> = (props) => {
  const { policy, onSave, onCancel } = props;
  const [formData, setFormData] = React.useState<
    Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>
  >(
    policy
      ? {
          name: policy.name,
          description: policy.description || '',
          dailyTokenLimit: policy.dailyTokenLimit,
          monthlyTokenLimit: policy.monthlyTokenLimit,
          rpmLimit: policy.rpmLimit,
        }
      : {
          name: '',
          description: undefined,
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              每日 Token 上限
            </label>
            <input
              type="number"
              name="dailyTokenLimit"
              value={formData.dailyTokenLimit}
              onChange={handleChange}
              required
              className={inputClassName}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              每月 Token 上限
            </label>
            <input
              type="number"
              name="monthlyTokenLimit"
              value={formData.monthlyTokenLimit}
              onChange={handleChange}
              required
              className={inputClassName}
            />
          </div>
          <div>
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
      </div>

      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          取消
        </button>
      </div>
    </form>
  );
};

export default PolicyForm;
