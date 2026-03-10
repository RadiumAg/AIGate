'use client';

import React from 'react';
import { Copy } from 'lucide-react';
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
              <Copy className="w-4 h-4 mr-1" />
              复制
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-auto max-h-[60vh]">
          <pre className="rounded-xl backdrop-blur-lg bg-white/60 dark:bg-black/40 border border-white/30 dark:border-white/10 p-4 text-sm overflow-x-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
            <code className="text-foreground">{generatedCode}</code>
          </pre>
          <div className="mt-4 p-3 rounded-xl backdrop-blur-lg bg-blue-500/10 dark:bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>说明：</strong> 此代码使用 AIGate 系统中已配置的 API Key，通过
              <code className="bg-blue-200/50 dark:bg-blue-500/30 px-1 rounded">X-API-Key-ID</code>{' '}
              头部字段指定要使用的 API Key。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CodeModal;
