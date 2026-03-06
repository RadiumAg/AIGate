import NextAuth, { getServerSession as nextAuthGetServerSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { logError, logInfo } from './lib/logger';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // 从环境变量读取管理员用户信息
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@aigate.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

        logInfo('认证尝试:', {
          inputEmail: credentials?.email,
          inputPassword: credentials?.password ? '***' : 'empty',
          expectedEmail: adminEmail,
          expectedPassword: '***',
          emailMatch: credentials?.email === adminEmail,
          passwordMatch: credentials?.password === adminPassword,
        });

        // 验证凭证
        if (credentials?.email === adminEmail && credentials?.password === adminPassword) {
          logInfo('认证成功 - 管理员用户', {
            id: '1',
            email: adminEmail,
            name: process.env.ADMIN_NAME || '系统管理员',
            role: 'ADMIN',
            status: 'ACTIVE',
          });
          return {
            id: '1',
            email: adminEmail,
            name: process.env.ADMIN_NAME || '系统管理员',
            role: 'ADMIN',
            status: 'ACTIVE',
          };
        }

        // 保留原来的测试用户作为备选
        if (credentials?.email === 'test@example.com' && credentials?.password === 'password') {
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

        logError('认证失败 - 凭证不匹配');
        return null;
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
