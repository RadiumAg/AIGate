'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/client';

interface MessageInputProps {
  message: { role: 'system' | 'user' | 'assistant'; content: string };
  index: number;
  canRemove: boolean;
  onChange: (index: number, field: 'role' | 'content', value: string) => void;
  onRemove: (index: number) => void;
}

const MessageInput: React.FC<MessageInputProps> = (props) => {
  const { t } = useTranslation();
  const { message, index, canRemove, onChange, onRemove } = props;

  return (
    <div className="rounded-xl p-3 backdrop-blur-lg bg-white/40 dark:bg-black/20 border border-white/30 dark:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.3)]">
      <div className="flex items-center justify-between mb-2">
        <Select
          value={message.role}
          onValueChange={(value: string) => onChange(index, 'role', value)}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">{t('Debug.roleSystem') as string}</SelectItem>
            <SelectItem value="user">{t('Debug.roleUser') as string}</SelectItem>
            <SelectItem value="assistant">{t('Debug.roleAssistant') as string}</SelectItem>
          </SelectContent>
        </Select>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
          >
            {t('Common.delete') as string}
          </Button>
        )}
      </div>
      <textarea
        value={message.content}
        onChange={(e) => onChange(index, 'content', e.target.value)}
        placeholder={t('Debug.enterMessageContent') as string}
        rows={3}
        className="w-full px-3 py-2 rounded-xl bg-white/60 dark:bg-black/30 backdrop-blur-lg border border-white/30 dark:border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.3)] text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:bg-white/70 dark:focus:bg-black/40 transition-all duration-200 resize-none"
      />
    </div>
  );
};

export default MessageInput;
