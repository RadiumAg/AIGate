'use client';

import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PolicyForm from './components/policy-form';
import PolicyTable from './components/policy-table';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { confirm } from '@/components/ui/confirm';
import { toast } from 'sonner';
import { useMemoizedFn } from 'ahooks';
import { useTranslation } from '@/i18n/client';
import PageHeader from '@/components/page-header';

interface QuotaPolicy {
  id: string;
  name: string;
  description?: string;
  limitType: 'token' | 'request';
  dailyTokenLimit?: number;
  monthlyTokenLimit?: number;
  dailyRequestLimit?: number;
  rpmLimit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const QuotasPage: React.FC = () => {
  const { t } = useTranslation();
  const {
    data: policies = [],
    refetch: refetchPolicies,
    isLoading,
  } = trpc.quota.getAllPolicies.useQuery();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingPolicy, setEditingPolicy] = React.useState<QuotaPolicy | null>(null);
  const createPolicyMutation = trpc.quota.createPolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
      toast.success(t('Quota.policyCreated') as string);
    },
  });

  const updatePolicyMutation = trpc.quota.updatePolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
      toast.success(t('Quota.policyUpdated') as string);
    },
  });

  const deletePolicyMutation = trpc.quota.deletePolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      toast.success(t('Quota.policyDeleted') as string);
    },
  });

  const handleAddPolicy = useMemoizedFn(() => {
    setEditingPolicy(null);
    setIsDialogOpen(true);
  });

  const handleEditPolicy = useMemoizedFn((policy: QuotaPolicy) => {
    setEditingPolicy(policy);
    setIsDialogOpen(true);
  });

  const handleDeletePolicy = useMemoizedFn((id: string) => {
    confirm(t('Quota.deleteConfirm') as string).then(() => {
      deletePolicyMutation.mutate({ id });
    });
  });

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
      <PageHeader
        title={t('Quota.title') as string}
        actions={<Button onClick={handleAddPolicy}>{t('Quota.newPolicy') as string}</Button>}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {(editingPolicy ? t('Quota.editPolicy') : t('Quota.createPolicy')) as string}
            </DialogTitle>
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

      {isLoading ? (
        <div className="rounded-2xl p-8 backdrop-blur-xl bg-white/50 dark:bg-black/25 border border-white/30 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.4)]">
          <div className="flex items-center justify-center">
            <Spinner className="h-8 w-8 text-primary" />
            <span className="ml-2 text-muted-foreground">{t('Common.loading') as string}</span>
          </div>
        </div>
      ) : (
        <PolicyTable
          policies={policies.map((policy) => ({
            ...policy,
            description: policy.description || undefined,
            limitType: (policy.limitType as 'token' | 'request') || 'token',
            dailyTokenLimit: policy.dailyTokenLimit || undefined,
            monthlyTokenLimit: policy.monthlyTokenLimit || undefined,
            dailyRequestLimit: policy.dailyRequestLimit || undefined,
          }))}
          onEdit={handleEditPolicy}
          onDelete={handleDeletePolicy}
          isLoading={
            createPolicyMutation.isPending ||
            updatePolicyMutation.isPending ||
            deletePolicyMutation.isPending
          }
        />
      )}
    </div>
  );
};

export default QuotasPage;
