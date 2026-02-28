import React from 'react';
import { trpc } from '@/components/trpc-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

const QuotasPage: React.FC = () => {
  // 获取配额策略数据
  const { data: policies = [], refetch: refetchPolicies } = trpc.quota.getAllPolicies.useQuery();

  // 创建策略 mutation
  const createPolicyMutation = trpc.quota.createPolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
    },
  });

  // 更新策略 mutation
  const updatePolicyMutation = trpc.quota.updatePolicy.useMutation({
    onSuccess: () => {
      refetchPolicies();
      setIsDialogOpen(false);
      setEditingPolicy(null);
    },
  });

  // 删除策略 mutation
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
          createPolicyMutation.isLoading ||
          updatePolicyMutation.isLoading ||
          deletePolicyMutation.isLoading
        }
      />
    </div>
  );
};

export default QuotasPage;

interface PolicyFormProps {
  policy: QuotaPolicy | null;
  onSave: (policy: Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const PolicyForm: React.FC<PolicyFormProps> = (props) => {
  const { policy, onSave, onCancel } = props;
  const [formData, setFormData] = React.useState<
    Omit<QuotaPolicy, 'id' | 'createdAt' | 'updatedAt'>
  >(
    policy
      ? {
          name: policy.name,
          description: policy.description || '',
          dailyTokenLimit: policy.dailyTokenLimit,
          monthlyTokenLimit: policy.monthlyTokenLimit,
          rpmLimit: policy.rpmLimit,
        }
      : {
          name: '',
          description: undefined,
          dailyTokenLimit: 5000,
          monthlyTokenLimit: 50000,
          rpmLimit: 60,
        }
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'name' || name === 'description' ? value : Number(value),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          策略名称
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="策略描述..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          每日 Token 上限
        </label>
        <input
          type="number"
          name="dailyTokenLimit"
          value={formData.dailyTokenLimit}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          每月 Token 上限
        </label>
        <input
          type="number"
          name="monthlyTokenLimit"
          value={formData.monthlyTokenLimit}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          每分钟请求次数 (RPM)
        </label>
        <input
          type="number"
          name="rpmLimit"
          value={formData.rpmLimit}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
      </div>
      <div className="flex space-x-3 pt-4">
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
        >
          取消
        </button>
      </div>
    </form>
  );
};

// 配额策略表格组件
interface PolicyTableProps {
  policies: QuotaPolicy[];
  onEdit: (policy: QuotaPolicy) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const PolicyTable: React.FC<PolicyTableProps> = (props) => {
  const { policies, onEdit, onDelete, isLoading = false } = props;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                策略名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                每日限额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                每月限额
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                RPM 限制
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {policies.map((policy) => (
              <tr key={policy.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {policy.name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                  {policy.description || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {policy.dailyTokenLimit.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {policy.monthlyTokenLimit.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {policy.rpmLimit}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {policy.createdAt ? new Date(policy.createdAt).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(policy)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete(policy.id)}
                      disabled={isLoading}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {policies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">暂无配额策略</p>
        </div>
      )}
    </div>
  );
};
