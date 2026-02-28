'use client';

import React, { FC } from 'react';
import { trpc } from '@/components/trpc-provider';

interface WhitelistRule {
  id: string;
  pattern: string;
  policyName: string;
  priority: number;
  status: 'active' | 'inactive';
  validationPattern?: string | null;
  validationEnabled: boolean;
  createdAt: string;
  description?: string | null;
}

interface WhitelistRuleFormProps {
  ruleData: WhitelistRule | null;
  onSave: (rule: Omit<WhitelistRule, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const inputClassName =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white';

const WhitelistRuleForm: FC<WhitelistRuleFormProps> = (props) => {
  const { ruleData, onSave, onCancel } = props;

  const { data: policies = [] } = trpc.quota.getAllPolicies.useQuery();

  const [formData, setFormData] = React.useState<Omit<WhitelistRule, 'id' | 'createdAt'>>({
    pattern: ruleData?.pattern || '',
    policyName: ruleData?.policyName || policies[0]?.name || '默认策略',
    description: ruleData?.description || '',
    priority: ruleData?.priority || 1,
    status: ruleData?.status || 'active',
    validationPattern: ruleData?.validationPattern || '',
    validationEnabled: ruleData?.validationEnabled || false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'priority' ? parseInt(value) || 1 : value,
    });
  };

  const handleToggleValidation = () => {
    setFormData({ ...formData, validationEnabled: !formData.validationEnabled });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          匹配模式
        </label>
        <input
          type="text"
          name="pattern"
          value={formData.pattern}
          onChange={handleChange}
          required
          placeholder="例如: *, *@company.com, user@example.com"
          className={inputClassName}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          支持通配符 *，例如：* 匹配所有用户，*@company.com 匹配公司邮箱
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          策略名称
        </label>
        <select
          name="policyName"
          value={formData.policyName}
          onChange={handleChange}
          required
          className={inputClassName}
        >
          {policies.length > 0 ? (
            policies.map((policy) => (
              <option key={policy.id} value={policy.name}>
                {policy.name}
              </option>
            ))
          ) : (
            <option value="默认策略">默认策略</option>
          )}
        </select>
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
          placeholder="规则描述..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          优先级
        </label>
        <input
          type="number"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          min="1"
          required
          className={inputClassName}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          数字越大优先级越高，匹配时优先使用高优先级规则
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          用户校验规则
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启用校验规则
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                开启后，通过 X-Request-User 传入的 userId 必须匹配正则表达式才允许请求
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
                placeholder="例如: ^user_[a-zA-Z0-9]+$ 或 ^[1-9]\d*$"
                className={inputClassName}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                请求时通过 X-Request-User 传入的 userId 必须匹配此正则表达式，不匹配将被拒绝
              </p>
            </div>
          )}
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

export default WhitelistRuleForm;
