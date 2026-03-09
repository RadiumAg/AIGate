'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ApiKey, ApiKeyFormData } from '@/types/api-key';

interface AddApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyData: ApiKey | null;
  onSave: (key: ApiKeyFormData) => void;
  isLoading: boolean;
}

const AddApiKeyDialog: React.FC<AddApiKeyDialogProps> = (props) => {
  const { open, onOpenChange, keyData, onSave, isLoading } = props;

  const [formData, setFormData] = React.useState<ApiKeyFormData>({
    name: keyData?.name || '',
    provider:
      (keyData?.provider as
        | 'openai'
        | 'anthropic'
        | 'google'
        | 'deepseek'
        | 'moonshot'
        | 'spark') || 'openai',
    key: keyData?.key || '',
    baseUrl: keyData?.baseUrl || '',
    lastUsed: keyData?.lastUsed || undefined,
    status: keyData?.status || 'active',
  });
  const [showKey, setShowKey] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  // 当 keyData 变化时更新表单数据
  React.useEffect(() => {
    if (keyData) {
      setFormData({
        name: keyData.name,
        provider: keyData.provider as
          | 'openai'
          | 'anthropic'
          | 'google'
          | 'deepseek'
          | 'moonshot'
          | 'spark',
        key: keyData.key,
        baseUrl: keyData.baseUrl || '',
        lastUsed: keyData.lastUsed,
        status: keyData.status,
      });
    } else {
      setFormData({
        name: '',
        provider: 'openai',
        key: '',
        baseUrl: '',
        lastUsed: undefined,
        status: 'active',
      });
    }
    setErrors({});
    setShowKey(false);
  }, [keyData, open]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '名称不能为空';
    }

    if (!formData.key.trim()) {
      newErrors.key = 'API Key 不能为空';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleInputChange = (field: keyof ApiKeyFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const getProviderDisplayName = (provider: string) => {
    const names = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google',
      deepseek: 'DeepSeek',
      moonshot: 'Moonshot',
      spark: '星火大模型',
    };
    return names[provider as keyof typeof names] || provider;
  };

  const getKeyPlaceholder = (provider: string) => {
    const placeholders = {
      openai: 'sk-************************************************',
      anthropic: 'sk-ant-*************************************',
      google: 'AI************************************',
      deepseek: 'sk-************************************************',
      moonshot: 'sk-************************************************',
      spark: 'sk-************************************************',
    };
    return placeholders[provider as keyof typeof placeholders] || 'API Key';
  };

  const getBaseUrlPlaceholder = (provider: string) => {
    const placeholders = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com/v1beta',
      deepseek: 'https://api.deepseek.com/v1',
      moonshot: 'https://api.moonshot.cn/v1',
      spark: 'https://spark-api.xf-yun.com/v1',
    };
    return placeholders[provider as keyof typeof placeholders] || 'https://api.example.com/v1';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>{keyData ? '编辑 API 密钥' : '添加 API 密钥'}</DialogTitle>
          <DialogDescription>
            {keyData ? '修改现有的 API 密钥信息' : '添加新的 AI 服务商 API 密钥'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                名称 <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="例如：OpenAI Production"
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="provider">
                服务商 <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={formData.provider}
                onValueChange={(value: string) => handleInputChange('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择服务商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="moonshot">Moonshot</SelectItem>
                  <SelectItem value="spark">星火大模型</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={!!errors.key}>
              <FieldLabel htmlFor="key">
                API Key <span className="text-red-500">*</span>
              </FieldLabel>
              <div className="relative">
                <Input
                  id="key"
                  type={showKey ? 'text' : 'password'}
                  value={formData.key}
                  onChange={(e) => handleInputChange('key', e.target.value)}
                  placeholder={getKeyPlaceholder(formData.provider)}
                  className="pr-10"
                  aria-invalid={!!errors.key}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              {errors.key && <FieldError>{errors.key}</FieldError>}
              <FieldDescription>
                请确保 API Key 格式正确，{getProviderDisplayName(formData.provider)} 的 API Key
                通常以特定前缀开头
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.baseUrl}>
              <FieldLabel htmlFor="baseUrl">自定义 API 基础 URL（可选）</FieldLabel>
              <Input
                id="baseUrl"
                type="url"
                value={formData.baseUrl}
                onChange={(e) => handleInputChange('baseUrl', e.target.value)}
                placeholder={getBaseUrlPlaceholder(formData.provider)}
                aria-invalid={!!errors.baseUrl}
              />
              {errors.baseUrl && <FieldError>{errors.baseUrl}</FieldError>}
              <FieldDescription>
                留空将使用默认的 {getProviderDisplayName(formData.provider)} API 地址。自定义 URL
                可用于代理服务或私有部署
              </FieldDescription>
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddApiKeyDialog;
