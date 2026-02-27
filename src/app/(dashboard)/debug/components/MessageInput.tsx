'use client';

import { FC } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MessageInputProps {
  message: { role: 'system' | 'user' | 'assistant'; content: string };
  index: number;
  onChange: (index: number, field: 'role' | 'content', value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

const MessageInput: FC<MessageInputProps> = (props) => {
  const { message, index, onChange, onRemove, canRemove } = props;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-2">
        <Select
          value={message.role}
          onValueChange={(value: string) => onChange(index, 'role', value)}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="assistant">Assistant</SelectItem>
          </SelectContent>
        </Select>
        {canRemove && (
          <button
            onClick={() => onRemove(index)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            删除
          </button>
        )}
      </div>
      <textarea
        value={message.content}
        onChange={(e) => onChange(index, 'content', e.target.value)}
        placeholder="输入消息内容..."
        rows={3}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
      />
    </div>
  );
};

export default MessageInput;
