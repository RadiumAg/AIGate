'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import type { ApiKey, ApiKeyFormData } from '@/types/api-key';
import ApiKeyTable from './components/api-key-table';
import DeleteConfirmModal from './components/delete-confirm-modal';
import AddApiKeyDialog from './components/add-api-key-dialog';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

const KeysPage: React.FC = () => {
  // tRPC hooks
  const { data: keys = [], isLoading, refetch } = trpc.apiKey.getAll.useQuery();
  const createMutation = trpc.apiKey.create.useMutation();
  const updateMutation = trpc.apiKey.update.useMutation();
  const deleteMutation = trpc.apiKey.delete.useMutation();
  const toggleStatusMutation = trpc.apiKey.toggleStatus.useMutation();
  const testKeyMutation = trpc.apiKey.testKey.useMutation();

  // 状态管理
  const [showDialog, setShowDialog] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState<ApiKey | null>(null);
  const [deleteModal, setDeleteModal] = React.useState<{
    isOpen: boolean;
    keyId: string;
    keyName: string;
  }>({
    isOpen: false,
    keyId: '',
    keyName: '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

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
        <Button onClick={handleAddKey} disabled={isLoading}>
          添加密钥
        </Button>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="ml-auto h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
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
            <Button
              variant="ghost"
              size="icon"
              onClick={clearMessages}
              className="ml-auto h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
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
