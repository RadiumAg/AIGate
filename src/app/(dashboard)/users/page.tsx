'use client';

import React, { FC } from 'react';
import { trpc } from '@/components/trpc-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import WhitelistRuleForm from './components/whitelist-rule-form';
import WhitelistRuleTable from './components/whitelist-rule-table';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';

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

const UsersPage: FC = () => {
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
    },
  });

  // 更新规则 mutation
  const updateRuleMutation = trpc.whitelist.update.useMutation({
    onSuccess: () => {
      refetchRules();
      setIsDialogOpen(false);
      setEditingRule(null);
    },
  });

  // 删除规则 mutation
  const deleteRuleMutation = trpc.whitelist.delete.useMutation({
    onSuccess: () => {
      refetchRules();
    },
  });

  // 切换规则状态 mutation
  const toggleStatusMutation = trpc.whitelist.toggleStatus.useMutation({
    onSuccess: () => {
      refetchRules();
    },
  });

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<WhitelistRule | null>(null);

  // 白名单管理函数
  const handleAddRule = () => {
    setEditingRule(null);
    setIsDialogOpen(true);
  };

  const handleEditRule = (rule: WhitelistRule) => {
    setEditingRule(rule);
    setIsDialogOpen(true);
  };

  const handleDeleteRule = (id: string) => {
    if (confirm('确定要删除这条白名单规则吗？')) {
      deleteRuleMutation.mutate({ id });
    }
  };

  const handleToggleRuleStatus = (id: string) => {
    toggleStatusMutation.mutate({ id });
  };

  const handleSaveRule = (rule: Omit<WhitelistRule, 'id' | 'createdAt'>) => {
    if (editingRule) {
      updateRuleMutation.mutate({
        ...rule,
        id: editingRule.id,
      });
    } else {
      createRuleMutation.mutate(rule);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">用户策略管理</h1>
        <Button onClick={handleAddRule}>添加规则</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRule ? '编辑白名单规则' : '添加白名单规则'}</DialogTitle>
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
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
            <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
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
