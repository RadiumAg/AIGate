'use client';

import React, { FC, useState } from 'react';
import ApiKeyTable from '@/components/ApiKeyTable';
import AddApiKeyDialog from '@/components/AddApiKeyDialog';
import { trpc } from '@/components/TRPCProvider';
import type { ApiKey, ApiKeyFormData } from '@/types/apiKey';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  keyName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal: FC<DeleteConfirmModalProps> = (props) => {
  const { isOpen, keyName, onConfirm, onCancel, isDeleting } = props;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <svg
            className="w-6 h-6 text-red-500 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">确认删除</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          确定要删除 API Key &quot;{keyName}&quot; 吗？此操作不可撤销。
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isDeleting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                删除中...
              </>
            ) : (
              '确认删除'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const KeysPage: FC = () => {
  // tRPC hooks
  const { data: keys = [], isLoading, refetch } = trpc.apiKey.getAll.useQuery();
  const createMutation = trpc.apiKey.create.useMutation();
  const updateMutation = trpc.apiKey.update.useMutation();
  const deleteMutation = trpc.apiKey.delete.useMutation();
  const toggleStatusMutation = trpc.apiKey.toggleStatus.useMutation();
  const testKeyMutation = trpc.apiKey.testKey.useMutation();

  // 状态管理
  const [showDialog, setShowDialog] = useState(false);
  const [editingKey, setEditingKey] = useState<ApiKey | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    keyId: string;
    keyName: string;
  }>({
    isOpen: false,
    keyId: '',
    keyName: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 清除消息
  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const handleAddKey = () => {
    clearMessages();
    setEditingKey(null);
    setShowDialog(true);
  };

  const handleEditKey = (key: ApiKey) => {
    clearMessages();
    setEditingKey(key);
    setShowDialog(true);
  };

  const handleDeleteKey = (id: string) => {
    const key = keys.find((k) => k.id === id);
    if (key) {
      setDeleteModal({
        isOpen: true,
        keyId: id,
        keyName: key.name,
      });
    }
  };

  const confirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: deleteModal.keyId });
      setSuccess('API Key 删除成功');
      setDeleteModal({ isOpen: false, keyId: '', keyName: '' });
      refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync({ id });
      setSuccess('状态切换成功');
      refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : '状态切换失败');
    }
  };

  const handleSaveKey = async (keyData: ApiKeyFormData) => {
    try {
      if (editingKey) {
        await updateMutation.mutateAsync({
          ...keyData,
          id: editingKey.id,
          createdAt: editingKey.createdAt,
        });
        setSuccess('API Key 更新成功');
      } else {
        await createMutation.mutateAsync(keyData);
        setSuccess('API Key 创建成功');
      }
      setShowDialog(false);
      setEditingKey(null);
      refetch();
    } catch (error) {
      setError(error instanceof Error ? error.message : '保存失败');
    }
  };

  const handleTestKey = async (key: ApiKey) => {
    try {
      const result = await testKeyMutation.mutateAsync({
        provider: key.provider,
        key: key.key,
      });
      if (result.isValid) {
        setSuccess(`${key.name} 测试成功，API Key 有效`);
      } else {
        setError(`${key.name} 测试失败：${result.error}`);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : '测试失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">API 密钥管理</h1>
        <button
          onClick={handleAddKey}
          disabled={isLoading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          添加密钥
        </button>
      </div>

      {/* 消息提示 */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-red-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
            <button onClick={clearMessages} className="ml-auto text-red-500 hover:text-red-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center">
            <svg
              className="w-5 h-5 text-green-500 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm text-green-800 dark:text-green-200">{success}</span>
            <button onClick={clearMessages} className="ml-auto text-green-500 hover:text-green-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
          </div>
        </div>
      ) : (
        <ApiKeyTable
          keys={keys}
          onEdit={handleEditKey}
          onDelete={handleDeleteKey}
          onToggleStatus={handleToggleStatus}
          onTest={handleTestKey}
          isTestingId={
            testKeyMutation.isPending
              ? keys.find((k) => testKeyMutation.variables?.provider === k.provider)?.id || null
              : null
          }
        />
      )}

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        keyName={deleteModal.keyName}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ isOpen: false, keyId: '', keyName: '' })}
        isDeleting={deleteMutation.isPending}
      />

      <AddApiKeyDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            clearMessages();
            setEditingKey(null);
          }
        }}
        keyData={editingKey}
        onSave={handleSaveKey}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
};

export default KeysPage;
