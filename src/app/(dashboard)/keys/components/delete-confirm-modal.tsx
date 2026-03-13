'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n/client';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = (props) => {
  const { isOpen, keyName, onConfirm, onCancel, isDeleting } = props;
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="rounded-2xl p-6 max-w-md w-full mx-4 backdrop-blur-2xl bg-white/80 dark:bg-black/60 border border-white/30 dark:border-white/10 shadow-[0_24px_48px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <div className="flex items-center mb-4">
          <div className="p-2 rounded-xl bg-red-500/20 backdrop-blur-sm mr-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">{t('Common.delete') as string}</h3>
        </div>
        <p className="text-muted-foreground mb-6">
          {(t('ApiKey.deleteWarning') as string).replace('{name}', keyName)}
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            {t('Common.cancel') as string}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner className="-ml-1 mr-2 h-4 w-4" />
                {t('ApiKey.deleting') as string}
              </>
            ) : (
              (t('ApiKey.deleteConfirm') as string)
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
