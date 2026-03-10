'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home,
  Settings,
  Gauge,
  Key,
  Users,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: '仪表板',
    href: '/',
    icon: <Home className="h-5 w-5" />,
  },
  {
    name: '接口调试',
    href: '/debug',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    name: '配额管理',
    href: '/quotas',
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    name: 'API 密钥',
    href: '/keys',
    icon: <Key className="h-5 w-5" />,
  },
  {
    name: '用户策略管理',
    href: '/users',
    icon: <Users className="h-5 w-5" />,
  },
];

const DashboardLayout: React.FC<DashboardLayoutProps> = (props) => {
  const { children } = props;
  const pathname = usePathname();
  const [darkMode, setDarkMode] = React.useState(false);

  const toggleTheme = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  React.useEffect(() => {
    // 在初始化时读取主题设置并应用
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark);

    // 更新 DOM
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // 更新状态（使用 setTimeout 避免同步 setState）
    setTimeout(() => {
      setDarkMode(isDark);
    }, 0);
  }, []);

  React.useEffect(() => {
    // 响应 darkMode 状态变化
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50/50 to-gray-100/50 dark:from-gray-900/50 dark:to-gray-800/50">
      {/* Sidebar - Enhanced Liquid Glass */}
      <aside className="w-64 flex flex-col backdrop-blur-2xl bg-white/70 dark:bg-black/40 border-r border-white/20 dark:border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.08)]">
        <div className="p-4 border-b border-white/20 dark:border-white/10">
          <h1 className="text-xl font-bold text-foreground flex items-center">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 backdrop-blur-sm border border-white/30 dark:border-white/10 mr-3 shadow-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            AIGate
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    pathname === item.href
                      ? 'bg-white/40 dark:bg-white/10 text-primary backdrop-blur-xl shadow-[0_4px_16px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.5)] border border-white/30 dark:border-white/10 scale-[1.02]'
                      : 'text-foreground/70 hover:bg-white/30 dark:hover:bg-white/5 hover:backdrop-blur-sm hover:scale-[1.02]'
                  }`}
                >
                  <span className="mr-3 opacity-80">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header - Enhanced Liquid Glass */}
        <header className="sticky top-0 z-10 backdrop-blur-2xl bg-white/60 dark:bg-black/30 border-b border-white/20 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-lg font-semibold text-foreground">
              {navigation.find((item) => item.href === pathname)?.name || '仪表板'}
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-foreground/70 hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] backdrop-blur-sm border border-white/30 dark:border-white/10 hover:scale-110 shadow-sm"
                title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-violet-500/80 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-lg p-0 hover:scale-110 hover:shadow-xl transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  >
                    A
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-40 p-2 rounded-2xl backdrop-blur-2xl bg-white/80 dark:bg-black/40 border border-white/30 dark:border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.15),inset_1px_1px_0_rgba(255,255,255,0.5)]"
                >
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl hover:bg-white/30 dark:hover:bg-white/10 hover:backdrop-blur-sm transition-all duration-200"
                      disabled
                    >
                      <User className="h-4 w-4 mr-2" />
                      <span>个人资料</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl hover:bg-white/30 dark:hover:bg-white/10 hover:backdrop-blur-sm transition-all duration-200"
                      onClick={() => {
                        window.location.href = '/settings';
                      }}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      <span>邮箱密码</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-2 py-1.5 h-8 text-sm rounded-xl text-red-600 hover:text-red-700 hover:bg-red-500/10 transition-all duration-200"
                      onClick={() => {
                        signOut({ callbackUrl: '/login' });
                      }}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      <span>退出登录</span>
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
