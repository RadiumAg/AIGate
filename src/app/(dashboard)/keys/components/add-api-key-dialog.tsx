'use client';

import React from 'react';
import { Eye, EyeOff, ChevronDown } from 'lucide-react';
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
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ApiKey, ApiKeyFormData } from '@/types/api-key';
import { useTranslation } from '@/i18n/client';

interface AddApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  keyData: ApiKey | null;
  onSave: (key: ApiKeyFormData) => void;
  isLoading: boolean;
}

const AddApiKeyDialog: React.FC<AddApiKeyDialogProps> = (props) => {
  const { open, onOpenChange, keyData, onSave, isLoading } = props;
  const { t } = useTranslation();

  const [formData, setFormData] = React.useState<ApiKeyFormData>({
    name: keyData?.name || '',
    id: keyData?.id || '',
    key: keyData?.key || '',
    baseUrl: keyData?.baseUrl || '',
    lastUsed: keyData?.lastUsed || '',
    status: keyData?.status || 'active',
    provider: keyData?.provider as ApiKey['provider'],
    promptPrice: keyData?.promptPrice,
    completionPrice: keyData?.completionPrice,
  });
  const [showKey, setShowKey] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('ApiKey.nameRequired') as string;
    }

    if (!formData.key.trim()) {
      newErrors.key = t('ApiKey.apiKeyRequired') as string;
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
    const names: Record<string, string> = {
      openai: 'OpenAI',
      deepseek: 'DeepSeek',
      moonshot: 'Moonshot',
      spark: 'Spark',
      kimi: 'Kimi',
      minimax: 'MiniMax',
    };
    return names[provider] || provider;
  };

  const getKeyPlaceholder = (provider: string) => {
    const placeholders: Record<string, string> = {
      openai: 'sk-************************************************',
      deepseek: 'sk-************************************************',
      moonshot: 'sk-************************************************',
      spark: 'sk-************************************************',
      kimi: 'sk-************************************************',
      minimax: 'sk-************************************************',
    };
    return placeholders[provider] || (t('ApiKey.apiKeyPlaceholder') as string);
  };

  const getBaseUrlPlaceholder = (provider: string) => {
    const placeholders: Record<string, string> = {
      openai: 'https://api.openai.com/v1',
      deepseek: 'https://api.deepseek.com/v1',
      moonshot: 'https://api.moonshot.cn/v1',
      spark: 'https://spark-api.xf-yun.com/v1',
      kimi: 'https://api.moonshot.cn/v1',
      minimax: 'https://api.minimax.chat/v1',
    };
    return placeholders[provider] || (t('ApiKey.baseUrlPlaceholder') as string);
  };

  // 当 keyData 变化时更新表单数据
  React.useEffect(() => {
    if (keyData) {
      setFormData({
        id: keyData.id,
        name: keyData.name,
        provider: keyData.provider as
          | 'openai'
          | 'deepseek'
          | 'moonshot'
          | 'spark'
          | 'kimi'
          | 'minimax',
        key: keyData.key,
        baseUrl: keyData.baseUrl || '',
        lastUsed: keyData.lastUsed,
        status: keyData.status,
        promptPrice: keyData.promptPrice,
        completionPrice: keyData.completionPrice,
      });
    } else {
      setFormData({
        id: '',
        name: '',
        provider: 'openai',
        key: '',
        baseUrl: '',
        lastUsed: undefined,
        status: 'active',
        promptPrice: undefined,
        completionPrice: undefined,
      });
    }
    setErrors({});
    setShowKey(false);
  }, [keyData, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {(keyData ? t('ApiKey.editKey') : t('ApiKey.createKey')) as string}
          </DialogTitle>
          <DialogDescription>
            {keyData ? (t('ApiKey.editKeyDesc') as string) : (t('ApiKey.createKeyDesc') as string)}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">
                {t('ApiKey.name') as string} <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="e.g. OpenAI Production"
                aria-invalid={!!errors.name}
              />
              {errors.name && <FieldError>{errors.name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="provider">
                {t('ApiKey.provider') as string} <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={formData.provider}
                onValueChange={(value: string) => handleInputChange('provider', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('ApiKey.providerPlaceholder') as string} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="moonshot">Moonshot</SelectItem>
                  <SelectItem value="spark">Spark</SelectItem>
                  <SelectItem value="kimi">Kimi</SelectItem>
                  <SelectItem value="minimax">MiniMax</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={!!errors.key}>
              <FieldLabel htmlFor="key">
                {t('ApiKey.apiKey') as string} <span className="text-red-500">*</span>
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
                {(t('ApiKey.apiKeyDesc') as string).replace(
                  '{provider}',
                  getProviderDisplayName(formData.provider)
                )}
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.baseUrl}>
              <FieldLabel htmlFor="baseUrl">{t('ApiKey.baseUrlOptional') as string}</FieldLabel>
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
                {(t('ApiKey.baseUrlDesc') as string).replace(
                  '{provider}',
                  getProviderDisplayName(formData.provider)
                )}
              </FieldDescription>
            </Field>

            {/* 定价配置 - 可折叠 */}
            <Collapsible className="border-t border-border/50 pt-4 mt-4">
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between text-sm font-medium text-foreground hover:text-foreground/80 transition-colors"
                >
                  <span>{t('ApiKey.pricingConfig') as string}</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3">
                <p className="text-xs text-muted-foreground mb-4">
                  {t('ApiKey.pricingConfigDesc') as string}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="promptPrice">
                      {t('ApiKey.promptPrice') as string}
                    </FieldLabel>
                    <Input
                      id="promptPrice"
                      type="number"
                      step="0.000001"
                      min="0"
                      value={formData.promptPrice ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData((prev) => ({ ...prev, promptPrice: value }));
                      }}
                      placeholder="e.g. 2.5"
                    />
                    <FieldDescription>{t('ApiKey.pricePerMillion') as string}</FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="completionPrice">
                      {t('ApiKey.completionPrice') as string}
                    </FieldLabel>
                    <Input
                      id="completionPrice"
                      type="number"
                      step="0.000001"
                      min="0"
                      value={formData.completionPrice ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : undefined;
                        setFormData((prev) => ({ ...prev, completionPrice: value }));
                      }}
                      placeholder="e.g. 10.0"
                    />
                    <FieldDescription>{t('ApiKey.pricePerMillion') as string}</FieldDescription>
                  </Field>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('ApiKey.cancel') as string}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (t('ApiKey.saving') as string) : (t('ApiKey.save') as string)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddApiKeyDialog;
