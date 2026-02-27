'use client';

import { useState } from 'react';
import { FC } from 'react';
import { trpc } from '@/components/TRPCProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
interface WhitelistRule {
  id: string;
  pattern: string;
  policyName: string;
  description: string;
  priority: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const UsersPage: FC = () => {
  // 获取白名单规则数据
  const { data: whitelistRules = [], refetch: refetchRules } = trpc.whitelist.getAll.useQuery();

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

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WhitelistRule | null>(null);

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
        createdAt: editingRule.createdAt,
      });
    } else {
      createRuleMutation.mutate(rule);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-text-dark">白名单规则管理</h1>
        <button
          onClick={handleAddRule}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          添加规则
        </button>
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

      <WhitelistRuleTable
        rules={whitelistRules}
        onEdit={handleEditRule}
        onDelete={handleDeleteRule}
        onToggleStatus={handleToggleRuleStatus}
        isLoading={
          createRuleMutation.isLoading ||
          updateRuleMutation.isLoading ||
          deleteRuleMutation.isLoading ||
          toggleStatusMutation.isLoading
        }
      />
    </div>
  );
};

export default UsersPage;

// 白名单规则表单组件
interface WhitelistRuleFormProps {
  ruleData: WhitelistRule | null;
  onSave: (rule: Omit<WhitelistRule, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
}

const WhitelistRuleForm: FC<WhitelistRuleFormProps> = (props) => {
  const { ruleData, onSave, onCancel } = props;

  // 获取所有配额策略
  const { data: policies = [] } = trpc.quota.getAllPolicies.useQuery();

  const [formData, setFormData] = useState<Omit<WhitelistRule, 'id' | 'createdAt'>>({
    pattern: ruleData?.pattern || '',
    policyName: ruleData?.policyName || policies[0]?.name || '默认策略',
    description: ruleData?.description || '',
    priority: ruleData?.priority || 1,
    status: ruleData?.status || 'active',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'priority' ? parseInt(value) || 1 : value,
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
          匹配模式
        </label>
        <input
          type="text"
          name="pattern"
          value={formData.pattern}
          onChange={handleChange}
          required
          placeholder="例如: *, *@company.com, user@example.com"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          支持通配符 *，例如：* 匹配所有用户，*@company.com 匹配公司邮箱
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          策略名称
        </label>
        <select
          name="policyName"
          value={formData.policyName}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        >
          {policies.length > 0 ? (
            policies.map((policy) => (
              <option key={policy.id} value={policy.name}>
                {policy.name}
              </option>
            ))
          ) : (
            <option value="默认策略">默认策略</option>
          )}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          描述
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="规则描述..."
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          优先级
        </label>
        <input
          type="number"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          min="1"
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          数字越大优先级越高，匹配时优先使用高优先级规则
        </p>
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

// 白名单规则表格组件
interface WhitelistRuleTableProps {
  rules: WhitelistRule[];
  onEdit: (rule: WhitelistRule) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
  isLoading?: boolean;
}

const WhitelistRuleTable: FC<WhitelistRuleTableProps> = (props) => {
  const { rules, onEdit, onDelete, onToggleStatus, isLoading = false } = props;

  const sortedRules = [...rules].sort((a, b) => b.priority - a.priority);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                优先级
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                匹配模式
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                策略名称
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                描述
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                状态
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
            {sortedRules.map((rule) => (
              <tr key={rule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {rule.priority}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <code className="text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {rule.pattern}
                  </code>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {rule.policyName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300 max-w-xs truncate">
                  {rule.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(rule.id)}
                    disabled={isLoading}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      rule.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}
                  >
                    {rule.status === 'active' ? '启用' : '禁用'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                  {rule.createdAt}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(rule)}
                      disabled={isLoading}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => onDelete(rule.id)}
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
      {sortedRules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">暂无白名单规则</p>
        </div>
      )}
    </div>
  );
};
