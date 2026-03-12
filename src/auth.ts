import NextAuth, { getServerSession as nextAuthGetServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { logError, logInfo } from './lib/logger';
import { userDb } from './lib/database';
import { isDemoMode, demoConfig } from './lib/demo-config';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          logError('认证失败 - 缺少凭证');
          return null;
        }

        // 演示模式：使用演示账号登录
        if (isDemoMode()) {
          if (
            credentials.email === demoConfig.demoCredentials.email &&
            credentials.password === demoConfig.demoCredentials.password
          ) {
            logInfo('演示模式认证成功', {
              id: demoConfig.defaultUser.id,
              email: demoConfig.defaultUser.email,
              name: demoConfig.defaultUser.name,
              role: demoConfig.defaultUser.role,
            });
            return {
              id: demoConfig.defaultUser.id,
              email: demoConfig.defaultUser.email,
              name: demoConfig.defaultUser.name,
              role: demoConfig.defaultUser.role,
              status: demoConfig.defaultUser.status,
            };
          }
          // 演示模式下也支持从 mock 数据登录
          const user = await userDb.getByEmail(credentials.email);
          if (user && user.password === credentials.password && user.status === 'ACTIVE') {
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              status: user.status,
            };
          }
          logError('演示模式认证失败 - 凭证不匹配');
          return null;
        }

        try {
          // 从数据库查找用户
          const user = await userDb.getByEmail(credentials.email);

          logInfo('认证尝试:', {
            inputEmail: credentials.email,
            inputPassword: credentials.password ? '***' : 'empty',
            userFound: !!user,
            userRole: user?.role,
            userStatus: user?.status,
          });

          // 验证用户存在、密码匹配、状态正常且是管理员
          if (
            user &&
            user.password === credentials.password &&
            user.status === 'ACTIVE' &&
            user.role === 'ADMIN'
          ) {
            logInfo('认证成功 - 数据库用户', {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              status: user.status,
            });
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
              status: user.status,
            };
          }

          // 保留原来的测试用户作为备选（开发用途）
          if (credentials.email === 'test@example.com' && credentials.password === 'password') {
            logInfo('认证成功 - 测试用户', {
              id: '2',
              email: 'test@example.com',
              name: 'Test User',
              role: 'USER',
              status: 'ACTIVE',
            });
            return {
              id: '2',
              email: 'test@example.com',
              name: 'Test User',
              role: 'USER',
              status: 'ACTIVE',
            };
          }

          logError('认证失败 - 凭证不匹配或用户状态异常');
          return null;
        } catch (error) {
          logError('认证过程出错:', {
            error: error instanceof Error ? error.message : String(error),
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login', // 登录错误时重定向到登录页面
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-key',
};

export function getServerSession() {
  return nextAuthGetServerSession(authOptions);
}

export default NextAuth(authOptions);
