'use client';

import React from 'react';
import { toast } from 'sonner';
import { trpc } from '@/components/trpc-provider';
import type { ApiKey, ApiKeyFormData } from '@/types/api-key';
import ApiKeyTable from './components/api-key-table';
import AddApiKeyDialog from './components/add-api-key-dialog';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/confirm';
import { useMemoizedFn } from 'ahooks';
import { useTranslation } from '@/i18n/client';

const KeysPage: React.FC = () => {
  const { t } = useTranslation();
  const [showDialog, setShowDialog] = React.useState(false);
  const [editingKey, setEditingKey] = React.useState<ApiKey | null>(null);
  const { data: keys = [], isLoading, refetch } = trpc.apiKey.getAll.useQuery();
  const createMutation = trpc.apiKey.create.useMutation({
    onSuccess: () => {
      toast.success(t('ApiKey.keyCreated') as string);
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('ApiKey.createFailed') as string));
    },
  });
  const updateMutation = trpc.apiKey.update.useMutation({
    onSuccess: () => {
      toast.success(t('ApiKey.keyUpdated') as string);
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('ApiKey.updateFailed') as string));
    },
  });
  const deleteMutation = trpc.apiKey.delete.useMutation({
    onSuccess: () => {
      toast.success(t('ApiKey.keyDeleted') as string);
      refetch();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('ApiKey.deleteFailed') as string));
    },
  });
  const toggleStatusMutation = trpc.apiKey.toggleStatus.useMutation({
    onSuccess: () => {
      toast.success(t('ApiKey.keyStatusToggled') as string);
      refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : (t('ApiKey.statusToggleFailed') as string)
      );
    },
  });

  const handleAddKey = () => {
    setEditingKey(null);
    setShowDialog(true);
  };

  const handleEditKey = useMemoizedFn((key: ApiKey) => {
    setEditingKey(key);
    setShowDialog(true);
  });

  const handleDeleteKey = useMemoizedFn((id: string) => {
    const key = keys.find((k) => k.id === id);
    if (key) {
      confirm({
        title: t('ApiKey.deleteConfirmTitle') as string,
        onConfirm: () => {
          deleteMutation.mutate({ id });
        },
      });
    }
  });

  const handleToggleStatus = useMemoizedFn((id: string) => {
    toggleStatusMutation.mutate({ id });
    refetch();
  });

  const handleSaveKey = useMemoizedFn((keyData: ApiKeyFormData) => {
    if (editingKey) {
      updateMutation.mutate({
        ...keyData,
        id: editingKey.id,
        key: keyData.key,
        createdAt: editingKey.createdAt,
      });
    } else {
      createMutation.mutate(keyData);
    }
    setShowDialog(false);
    setEditingKey(null);
    refetch();
  });

  return (
    <div className="space-y-6">
      {/* Header with Liquid Glass */}
      <div className="flex justify-between items-center rounded-2xl p-6 backdrop-blur-xl bg-white/60 dark:bg-black/30 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.4)]">
        <h1 className="text-2xl font-bold text-foreground">{t('ApiKey.title') as string}</h1>
        <Button onClick={handleAddKey} disabled={isLoading}>
          {t('ApiKey.addKey') as string}
        </Button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="ml-2 text-muted-foreground">{t('Common.loading') as string}</span>
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

      <AddApiKeyDialog
        open={showDialog}
        keyData={editingKey}
        isLoading={createMutation.isPending || updateMutation.isPending}
        onSave={handleSaveKey}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) {
            setEditingKey(null);
          }
        }}
      />
    </div>
  );
};

export default KeysPage;
