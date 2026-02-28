'use client';

import React from 'react';

type IdentifyBy = 'ip' | 'origin' | 'email' | 'userId';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  rpmLimit: number;
  identifyBy: IdentifyBy;
  validationPattern?: string;
  validationEnabled: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

interface PolicyFormProps {
  policy: QuotaPolicy | null;
  onSave: (policy: Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const IDENTIFY_BY_OPTIONS: { value: IdentifyBy; label: string; description: string }[] = [
  { value: 'email', label: 'Email', description: '通过用户邮箱标识' },
  { value: 'userId', label: 'User ID', description: '通过自定义用户 ID 标识' },
  { value: 'ip', label: 'IP 地址', description: '通过请求 IP 地址标识' },
  { value: 'origin', label: 'Origin', description: '通过请求来源域名标识' },
];

const inputClassName =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white';

const EMAIL_PLACEHOLDER = '例如: ^[\\w.]+@company\\.com$';
const USER_ID_PLACEHOLDER = '例如: ^user_[a-zA-Z0-9]+$';

const PolicyForm: React.FC<PolicyFormProps> = (props) => {
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
          identifyBy: policy.identifyBy || 'email',
          validationPattern: policy.validationPattern || '',
          validationEnabled: policy.validationEnabled || false,
        }
      : {
          name: '',
          description: undefined,
          dailyTokenLimit: 5000,
          monthlyTokenLimit: 50000,
          rpmLimit: 60,
          identifyBy: 'email',
          validationPattern: '',
          validationEnabled: false,
        }
  );

  const supportsValidation = formData.identifyBy === 'email' || formData.identifyBy === 'userId';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'name' || name === 'description' || name === 'validationPattern') {
      setFormData({ ...formData, [name]: value });
    } else if (name === 'identifyBy') {
      const newIdentifyBy = value as IdentifyBy;
      const shouldResetValidation = newIdentifyBy !== 'email' && newIdentifyBy !== 'userId';
      setFormData({
        ...formData,
        identifyBy: newIdentifyBy,
        validationEnabled: shouldResetValidation ? false : formData.validationEnabled,
        validationPattern: shouldResetValidation ? '' : formData.validationPattern,
      });
    } else {
      setFormData({ ...formData, [name]: Number(value) });
    }
  };

  const handleToggleValidation = () => {
    setFormData({ ...formData, validationEnabled: !formData.validationEnabled });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const validationPlaceholder =
    formData.identifyBy === 'email' ? EMAIL_PLACEHOLDER : USER_ID_PLACEHOLDER;

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

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          用户标识方式
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            标识方式
          </label>
          <select
            name="identifyBy"
            value={formData.identifyBy}
            onChange={handleChange}
            className={inputClassName}
          >
            {IDENTIFY_BY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>

        {supportsValidation && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  启用校验规则
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  开启后，{formData.identifyBy === 'email' ? '邮箱' : '用户 ID'}{' '}
                  必须匹配正则表达式才允许请求
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleValidation}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                  formData.validationEnabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.validationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {formData.validationEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  校验规则（正则表达式）
                </label>
                <input
                  type="text"
                  name="validationPattern"
                  value={formData.validationPattern || ''}
                  onChange={handleChange}
                  placeholder={validationPlaceholder}
                  className={inputClassName}
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  请求时传入的{formData.identifyBy === 'email' ? '邮箱' : '用户 ID'}
                  必须匹配此正则表达式，不匹配将被拒绝
                </p>
              </div>
            )}
          </div>
        )}
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
