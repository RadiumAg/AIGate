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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';

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
    <div className="flex h-screen bg-background">
      {/* Sidebar - Liquid Glass */}
      <aside className="w-64 flex flex-col backdrop-blur-xl bg-(--card)/80 border-r border-border">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-bold text-primary flex items-center drop-shadow-sm">
            <ShieldCheck className="h-6 w-6 mr-2" />
            AIGate 管理后台
          </h1>
        </div>
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                    pathname === item.href
                      ? 'bg-(--primary-glass) text-primary backdrop-blur-sm shadow-sm'
                      : 'text-(--foreground)/70 hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header - Liquid Glass */}
        <header className="sticky top-0 z-10 backdrop-blur-xl bg-(--card)/70 border-b border-border">
          <div className="flex justify-between items-center p-4">
            <h2 className="text-lg font-semibold text-foreground">
              {navigation.find((item) => item.href === pathname)?.name || '仪表板'}
            </h2>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-all duration-200 backdrop-blur-sm"
                title={darkMode ? '切换到浅色模式' : '切换到深色模式'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              <Select
                onValueChange={(value) => {
                  if (value === 'logout') {
                    signOut({ callbackUrl: '/login' });
                  }
                }}
              >
                <SelectTrigger className="w-auto border-0 bg-transparent p-0 h-auto focus:ring-0 focus:ring-offset-0">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-primary to-violet-500 flex items-center justify-center text-white shadow-lg cursor-pointer">
                    A
                  </div>
                </SelectTrigger>
                <SelectContent align="end" className="w-40">
                  <SelectItem value="profile" disabled>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>个人资料</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="logout">
                    <div className="flex items-center gap-2">
                      <LogOut className="h-4 w-4" />
                      <span>退出登录</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

export default DashboardLayout;
