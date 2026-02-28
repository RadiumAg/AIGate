'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface CodeModalProps {
  isOpen: boolean;
  generatedCode: string;
  onClose: () => void;
  onCopyToClipboard: (text: string) => void;
}

const CodeModal: React.FC<CodeModalProps> = (props) => {
  const { isOpen, generatedCode, onClose, onCopyToClipboard } = props;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>生成的代码</span>
            <Button variant="secondary" size="sm" onClick={() => onCopyToClipboard(generatedCode)}>
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              复制
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm overflow-x-auto">
            <code className="text-gray-800 dark:text-gray-200">{generatedCode}</code>
          </pre>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>说明：</strong> 此代码使用 AIGate 系统中已配置的 API Key，通过
              <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">X-API-Key-ID</code>{' '}
              头部字段指定要使用的 API Key。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeModal;
