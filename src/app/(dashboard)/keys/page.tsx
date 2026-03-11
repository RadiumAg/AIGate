'use client';

import React from 'react';
import { toast } from 'sonner';
import { trpc } from '@/components/trpc-provider';
import type { ApiKey, ApiKeyFormData } from '@/types/api-key';
import ApiKeyTable from './components/api-key-table';
import DeleteConfirmModal from './components/delete-confirm-modal';
import AddApiKeyDialog from './components/add-api-key-dialog';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const KeysPage: React.FC = () => {
  // tRPC hooks
  const { data: keys = [], isLoading, refetch } = trpc.apiKey.getAll.useQuery();
  const createMutation = trpc.apiKey.create.useMutation();
  const updateMutation = trpc.apiKey.update.useMutation();
  const deleteMutation = trpc.apiKey.delete.useMutation();
  const toggleStatusMutation = trpc.apiKey.toggleStatus.useMutation();

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
  const handleAddKey = () => {
    setEditingKey(null);
    setShowDialog(true);
  };

  const handleEditKey = (key: ApiKey) => {
    setEditingKey(key);
    setShowDialog(true);
  };

  const handleDeleteKey = (id: string) => {
    const key = keys.find((k) => k.originId === id);
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
      toast.success('API Key 删除成功');
      setDeleteModal({ isOpen: false, keyId: '', keyName: '' });
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败');
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleStatusMutation.mutateAsync({ id });
      toast.success('状态切换成功');
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '状态切换失败');
    }
  };

  const handleSaveKey = async (keyData: ApiKeyFormData) => {
    try {
      if (editingKey) {
        await updateMutation.mutateAsync({
          ...keyData,
          id: editingKey.originId,
          createdAt: editingKey.createdAt,
        });
        toast.success('API Key 更新成功');
      } else {
        await createMutation.mutateAsync(keyData);
        toast.success('API Key 创建成功');
      }
      setShowDialog(false);
      setEditingKey(null);
      refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Liquid Glass */}
      <div className="flex justify-between items-center rounded-2xl p-6 backdrop-blur-xl bg-white/60 dark:bg-black/30 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <h1 className="text-2xl font-bold text-foreground">API 密钥管理</h1>
        <Button onClick={handleAddKey} disabled={isLoading}>
          添加密钥
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="ml-2 text-muted-foreground">加载中...</span>
          </div>
        </div>
      ) : (
        <ApiKeyTable
          keys={keys}
          onEdit={handleEditKey}
          onDelete={handleDeleteKey}
          onToggleStatus={handleToggleStatus}
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
