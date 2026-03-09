'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface WhitelistRule {
  id: string;
  policyName: string;
  priority: number;
  status: 'active' | 'inactive';
  validationPattern?: string | null;
  userIdPattern?: string | null;
  validationEnabled: boolean;
  apiKeyId?: string | null;
  createdAt: string;
  description?: string | null;
}

interface WhitelistRuleFormProps {
  ruleData: WhitelistRule | null;
  onSave: (rule: Omit<WhitelistRule, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

interface PatternPreset {
  trigger: string;
  label: string;
  description: string;
  pattern: string;
}

const PATTERN_PRESETS: PatternPreset[] = [
  {
    trigger: '@ip',
    label: '@ip',
    description: 'ipv4占用符',
    pattern: '@ip',
  },
  {
    trigger: '@user_id',
    label: '@user_id',
    description: 'userId占用符',
    pattern: '@user_id',
  },
  {
    trigger: '@any',
    label: '@any',
    description: '匹配任意非空字符串',
    pattern: '@any',
  },
];

const USERID_PRESENTS = [
  {
    trigger: '@ip',
    label: '@ip',
    description: '匹配 IPv4 地址格式',
    pattern: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$',
  },
  {
    trigger: '@ip_range',
    label: '@ip_range',
    description: '匹配 IP 段（如 192.168.*.*）',
    pattern: '^192\\.168\\.\\d{1,3}\\.\\d{1,3}$',
  },
  {
    trigger: '@email',
    label: '@email',
    description: '匹配邮箱格式',
    pattern: '^[\\w.+-]+@[\\w-]+\\.[\\w.]+$',
  },
  {
    trigger: '@email_domain',
    label: '@email_domain',
    description: '匹配指定域名邮箱（需修改 domain）',
    pattern: '^[\\w.+-]+@company\\.com$',
  },
  {
    trigger: '@origin',
    label: '@origin',
    description: '匹配 HTTP Origin（如 https://example.com）',
    pattern: '^https?://[\\w.-]+(:\\d+)?$',
  },
  {
    trigger: '@numeric',
    label: '@numeric',
    description: '匹配纯数字 ID',
    pattern: '^[1-9]\\d*$',
  },
  {
    trigger: '@uuid',
    label: '@uuid',
    description: '匹配 UUID 格式',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
  },
  {
    trigger: '@prefix',
    label: '@prefix',
    description: '匹配带前缀的 ID（如 user_xxx）',
    pattern: '^user_[a-zA-Z0-9]+$',
  },
  {
    trigger: '@any',
    label: '@any',
    description: '匹配任意非空字符串',
    pattern: '^.+$',
  },
];

const inputClassName =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white';

const WhitelistRuleForm: React.FC<WhitelistRuleFormProps> = (props) => {
  const { ruleData, onSave, onCancel } = props;

  const { data: policies = [] } = trpc.quota.getAllPolicies.useQuery();
  const { data: apiKeys = [] } = trpc.apiKey.getAll.useQuery();

  const [formData, setFormData] = React.useState<Omit<WhitelistRule, 'id' | 'createdAt'>>({
    policyName: ruleData?.policyName || policies[0]?.name || '默认策略',
    description: ruleData?.description || '',
    priority: ruleData?.priority || 1,
    status: ruleData?.status || 'active',
    validationPattern: ruleData?.validationPattern || '',
    userIdPattern: ruleData?.userIdPattern || '',
    validationEnabled: ruleData?.validationEnabled || false,
    apiKeyId: ruleData?.apiKeyId || null,
  });

  const [showPresets, setShowPresets] = React.useState(false);
  const [presetFilter, setPresetFilter] = React.useState('');
  const [selectedPresetIndex, setSelectedPresetIndex] = React.useState(0);
  const [showUserIdPresets, setShowUserIdPresets] = React.useState(false);
  const [userIdPresetFilter, setUserIdPresetFilter] = React.useState('');
  const [selectedUserIdPresetIndex, setSelectedUserIdPresetIndex] = React.useState(0);
  const presetDropdownRef = React.useRef<HTMLDivElement>(null);
  const userIdPresetDropdownRef = React.useRef<HTMLDivElement>(null);
  const validationInputRef = React.useRef<HTMLInputElement>(null);
  const userIdPatternInputRef = React.useRef<HTMLInputElement>(null);

  const filteredPresets = React.useMemo(() => {
    if (!presetFilter) return USERID_PRESENTS;
    const lowerFilter = presetFilter.toLowerCase();
    return USERID_PRESENTS.filter(
      (preset) =>
        preset.trigger.toLowerCase().includes(lowerFilter) ||
        preset.description.toLowerCase().includes(lowerFilter)
    );
  }, [presetFilter]);

  const filteredUserIdPresets = React.useMemo(() => {
    if (!userIdPresetFilter) return PATTERN_PRESETS;
    const lowerFilter = userIdPresetFilter.toLowerCase();
    return PATTERN_PRESETS.filter(
      (preset) =>
        preset.trigger.toLowerCase().includes(lowerFilter) ||
        preset.description.toLowerCase().includes(lowerFilter)
    );
  }, [userIdPresetFilter]);

  const handleChange = (changeValue: Record<string, any>) => {
    const { name, value } = changeValue;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleValidationPatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, validationPattern: value });

    const atIndex = value.lastIndexOf('@');
    if (atIndex >= 0) {
      const afterAt = value.substring(atIndex);
      setPresetFilter(afterAt);
      setShowPresets(true);
      setSelectedPresetIndex(0);
    } else {
      setShowPresets(false);
      setPresetFilter('');
    }
  };

  const handleUserIdPatternChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, userIdPattern: value });

    const atIndex = value.lastIndexOf('@');
    if (atIndex >= 0) {
      const afterAt = value.substring(atIndex);
      setUserIdPresetFilter(afterAt);
      setShowUserIdPresets(true);
      setSelectedUserIdPresetIndex(0);
    } else {
      setShowUserIdPresets(false);
      setUserIdPresetFilter('');
    }
  };

  const handleSelectPreset = (preset: PatternPreset) => {
    const currentValue = formData.validationPattern || '';
    const atIndex = currentValue.lastIndexOf('@');

    const newValue =
      atIndex >= 0 ? currentValue.substring(0, atIndex) + preset.pattern : preset.pattern;

    setFormData({ ...formData, validationPattern: newValue });
    setShowPresets(false);
    setPresetFilter('');
    validationInputRef.current?.focus();
  };

  const handleSelectUserIdPreset = (preset: PatternPreset) => {
    const currentValue = formData.userIdPattern || '';
    const atIndex = currentValue.lastIndexOf('@');

    const newValue =
      atIndex >= 0 ? currentValue.substring(0, atIndex) + preset.pattern : preset.pattern;

    setFormData({ ...formData, userIdPattern: newValue });
    setShowUserIdPresets(false);
    setUserIdPresetFilter('');
    userIdPatternInputRef.current?.focus();
  };

  const handleValidationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPresets || filteredPresets.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedPresetIndex((prev) => Math.min(prev + 1, filteredPresets.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedPresetIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && showPresets) {
      e.preventDefault();
      handleSelectPreset(filteredPresets[selectedPresetIndex]);
    } else if (e.key === 'Escape') {
      setShowPresets(false);
    }
  };

  const handleUserIdPatternKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showUserIdPresets || filteredUserIdPresets.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedUserIdPresetIndex((prev) => Math.min(prev + 1, filteredUserIdPresets.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedUserIdPresetIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && showUserIdPresets) {
      e.preventDefault();
      handleSelectUserIdPreset(filteredUserIdPresets[selectedUserIdPresetIndex]);
    } else if (e.key === 'Escape') {
      setShowUserIdPresets(false);
    }
  };

  const handleToggleValidation = () => {
    setFormData({ ...formData, validationEnabled: !formData.validationEnabled });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (presetDropdownRef.current && !presetDropdownRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
      if (
        userIdPresetDropdownRef.current &&
        !userIdPresetDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserIdPresets(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          策略名称
        </label>
        <Select
          name="policyName"
          value={formData.policyName}
          onValueChange={(value) =>
            handleChange({
              target: { name: 'policyName', value },
            } as React.ChangeEvent<HTMLSelectElement>)
          }
          required
        >
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder="选择策略" />
          </SelectTrigger>
          <SelectContent>
            {policies.length > 0 ? (
              policies.map((policy) => (
                <SelectItem key={policy.id} value={policy.name}>
                  {policy.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="默认策略">默认策略</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <Textarea
          name="description"
          value={formData.description || ''}
          rows={3}
          className={inputClassName}
          placeholder="规则描述..."
          onChange={(value) => {
            handleChange({ name: 'description', value });
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          优先级
        </label>
        <Input
          type="number"
          name="priority"
          value={formData.priority}
          min="1"
          required
          className={inputClassName}
          onChange={(value) => {
            handleChange({ name: 'priority', value });
          }}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          数字越大优先级越高，匹配时优先使用高优先级规则
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          关联 API Key
        </label>
        <Select
          name="apiKeyId"
          value={formData.apiKeyId || ''}
          onValueChange={(value) =>
            handleChange({ name: 'apiKeyId', value: value === 'none' ? '' : value })
          }
        >
          <SelectTrigger className={inputClassName}>
            <SelectValue placeholder="不关联 API Key" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">不关联 API Key</SelectItem>
            {apiKeys.map((apiKey) => (
              <SelectItem key={apiKey.id} value={apiKey.originId}>
                {apiKey.name} ({apiKey.provider})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          选择关联的 API Key，每个 API Key 只能绑定一个白名单规则
        </p>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          UserId 格式生成规则
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UserId 格式生成规则 (userIdPattern)
          </label>
          <div className="relative" ref={userIdPresetDropdownRef}>
            <Input
              ref={userIdPatternInputRef}
              type="text"
              name="userIdPattern"
              value={formData.userIdPattern || ''}
              onChange={handleUserIdPatternChange}
              onKeyDown={handleUserIdPatternKeyDown}
              onFocus={() => {
                const value = formData.userIdPattern || '';
                if (value.includes('@')) {
                  setUserIdPresetFilter(value.substring(value.lastIndexOf('@')));
                  setShowUserIdPresets(true);
                }
              }}
              placeholder="输入 @ 可快速选择预设模板（如 @ip 、 @user_id 、 @any）"
              className={inputClassName}
            />

            {showUserIdPresets && filteredUserIdPresets.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {filteredUserIdPresets.map((preset, index) => (
                  <button
                    key={preset.trigger}
                    type="button"
                    onClick={() => handleSelectUserIdPreset(preset)}
                    className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors bg-transparent border-0 ${
                      index === selectedUserIdPresetIndex ? 'bg-accent' : 'hover:bg-muted'
                    }`}
                  >
                    <code className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap mt-0.5">
                      {preset.label}
                    </code>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        {preset.description}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        {preset.pattern}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            用于校验传入的 userId 格式，不符合此模式的请求将被拒绝。 留空表示不进行格式校验。
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          用户UserId校验规则
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                启用校验规则
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                开启后，传入的 userId 必须匹配校验规则才允许请求
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleValidation}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                formData.validationEnabled ? 'bg-primary' : 'bg-muted'
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
            <div className="relative" ref={presetDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                校验规则
              </label>
              <Input
                ref={validationInputRef}
                type="text"
                value={formData.validationPattern || ''}
                onChange={handleValidationPatternChange}
                onKeyDown={handleValidationKeyDown}
                onFocus={() => {
                  const value = formData.validationPattern || '';
                  if (value.includes('@')) {
                    setPresetFilter(value.substring(value.lastIndexOf('@')));
                    setShowPresets(true);
                  }
                }}
                placeholder="输入正则表达式，或输入 @ 选择预设模板"
                className={inputClassName}
              />

              {showPresets && filteredPresets.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {filteredPresets.map((preset, index) => (
                    <button
                      key={preset.trigger}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors bg-transparent border-0 ${
                        index === selectedPresetIndex ? 'bg-accent' : 'hover:bg-muted'
                      }`}
                    >
                      <code className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap mt-0.5">
                        {preset.label}
                      </code>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 dark:text-gray-200">
                          {preset.description}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                          {preset.pattern}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {'输入 '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">@</code>
                {' 可快速选择预设模板（如 '}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">@ip</code>
                {'、'}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">@email</code>
                {'、'}
                <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">@origin</code>
                {'），也可直接输入正则表达式'}
              </p>
            </div>
          )}
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

export default WhitelistRuleForm;
