'use client';

import React, { FC } from 'react';
import { trpc } from '@/components/trpc-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PolicyForm from './components/policy-form';
import PolicyTable from './components/policy-table';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  dailyTokenLimit: number;
  monthlyTokenLimit: number;
  rpmLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const QuotasPage: FC = () => {
  const { data: policies = [], refetch: refetchPolicies } = trpc.quota.getAllPolicies.useQuery();

  const createPolicyMutation = trpc.quota.createPolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
    },
  });

  const updatePolicyMutation = trpc.quota.updatePolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
    },
  });

  const deletePolicyMutation = trpc.quota.deletePolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
    },
  });

  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<QuotaPolicy | null>(null);

  const handleAddPolicy = () => {
    setEditingPolicy(null);
    setIsDialogOpen(true);
  };

  const handleEditPolicy = (policy: QuotaPolicy) => {
    setEditingPolicy(policy);
    setIsDialogOpen(true);
  };

  const handleDeletePolicy = (id: string) => {
    if (confirm('确定要删除这个配额策略吗？')) {
      deletePolicyMutation.mutate({ id });
    }
  };

  const handleSavePolicy = (policy: Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingPolicy) {
      updatePolicyMutation.mutate({
        ...policy,
        id: editingPolicy.id,
        description: policy.description || undefined,
      });
    } else {
      createPolicyMutation.mutate({
        ...policy,
        description: policy.description || undefined,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-text-dark">配额管理</h1>
        <button
          onClick={handleAddPolicy}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          新建策略
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPolicy ? '编辑配额策略' : '新建配额策略'}</DialogTitle>
          </DialogHeader>
          <PolicyForm
            policy={editingPolicy}
            onSave={handleSavePolicy}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingPolicy(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <PolicyTable
        policies={policies.map((policy) => ({
          ...policy,
          description: policy.description || undefined,
        }))}
        onEdit={handleEditPolicy}
        onDelete={handleDeletePolicy}
        isLoading={
          createPolicyMutation.isPending ||
          updatePolicyMutation.isPending ||
          deletePolicyMutation.isPending
        }
      />
    </div>
  );
};

export default QuotasPage;
