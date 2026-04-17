'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WhitelistRuleForm from './components/whitelist-rule-form';
import WhitelistRuleTable from './components/whitelist-rule-table';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/confirm';
import { toast } from 'sonner';
import { useMemoizedFn } from 'ahooks';
import { useTranslation } from '@/i18n/client';
import PageHeader from '@/components/page-header';

interface WhitelistRule {
  id: string;
  policyName: string;
  priority: number;
  status: 'active' | 'inactive';
  validationPattern?: string | null;
  validationEnabled: boolean;
  createdAt: string;
  description?: string | null;
}

const UsersPage: React.FC = () => {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<WhitelistRule | null>(null);
  // 获取白名单规则数据
  const {
    data: whitelistRules = [],
    refetch: refetchRules,
    isLoading,
  } = trpc.whitelist.getAll.useQuery();

  // 创建规则 mutation
  const createRuleMutation = trpc.whitelist.create.useMutation({
    onSuccess: () => {
      refetchRules();
      setIsDialogOpen(false);
      setEditingRule(null);
      toast.success(t('User.ruleCreated') as string);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('User.createFailed') as string));
    },
  });

  // 更新规则 mutation
  const updateRuleMutation = trpc.whitelist.update.useMutation({
    onSuccess: () => {
      refetchRules();
      setIsDialogOpen(false);
      setEditingRule(null);
      toast.success(t('User.ruleUpdated') as string);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('User.updateFailed') as string));
    },
  });

  // 删除规则 mutation
  const deleteRuleMutation = trpc.whitelist.delete.useMutation({
    onSuccess: () => {
      refetchRules();
      toast.success(t('User.ruleDeleted') as string);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('User.deleteFailed') as string));
    },
  });

  // 切换规则状态 mutation
  const toggleStatusMutation = trpc.whitelist.toggleStatus.useMutation({
    onSuccess: () => {
      refetchRules();
      toast.success(t('User.ruleStatusToggled') as string);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : (t('User.toggleFailed') as string));
    },
  });

  // 白名单管理函数
  const handleAddRule = useMemoizedFn(() => {
    setEditingRule(null);
    setIsDialogOpen(true);
  });

  const handleEditRule = useMemoizedFn((rule: WhitelistRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  });

  const handleDeleteRule = useMemoizedFn((id: string) => {
    confirm(t('User.deleteConfirm') as string).then(() => {
      deleteRuleMutation.mutate({ id });
    });
  });

  const handleToggleRuleStatus = useMemoizedFn((id: string) => {
    toggleStatusMutation.mutate({ id });
  });

  const handleSaveRule = useMemoizedFn((rule: Omit<WhitelistRule, 'id' | 'createdAt'>) => {
    if (editingRule) {
      updateRuleMutation.mutate({
        ...rule,
        id: editingRule.id,
      });
    } else {
      createRuleMutation.mutate(rule);
    }
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('User.title') as string}
        actions={<Button onClick={handleAddRule}>{t('User.addRule') as string}</Button>}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {(editingRule ? t('User.editRule') : t('User.createRule')) as string}
            </DialogTitle>
          </DialogHeader>
          <WhitelistRuleForm
            ruleData={editingRule}
            onSave={handleSaveRule}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingRule(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="ml-2 text-muted-foreground">{t('Common.loading') as string}</span>
          </div>
        </div>
      ) : (
        <WhitelistRuleTable
          rules={whitelistRules}
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          onToggleStatus={handleToggleRuleStatus}
          isLoading={
            createRuleMutation.isPending ||
            updateRuleMutation.isPending ||
            deleteRuleMutation.isPending ||
            toggleStatusMutation.isPending
          }
        />
      )}
    </div>
  );
};

export default UsersPage;
