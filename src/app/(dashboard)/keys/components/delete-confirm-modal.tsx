'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = (props) => {
  const { isOpen, keyName, onConfirm, onCancel, isDeleting } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-6 h-6 text-red-500 mr-3" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认删除</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          确定要删除 API Key &quot;{keyName}&quot; 吗？此操作不可撤销。
        </p>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={isDeleting}>
            取消
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner className="-ml-1 mr-2 h-4 w-4" />
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
