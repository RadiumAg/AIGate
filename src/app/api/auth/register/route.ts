import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/drizzle';
import { users } from '@/lib/schema';
import { nanoid } from 'nanoid';

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // 检查用户是否已存在
    const existingUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json({ error: '用户已存在' }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);

    // 创建用户（需要关联到默认配额策略）
    const defaultPolicy = await db.query.quotaPolicies.findFirst();

    if (!defaultPolicy) {
      return NextResponse.json({ error: '系统尚未配置默认配额策略' }, { status: 500 });
    }

    const newUser = await db.insert(users).values({
      id: nanoid(),
      name,
      email,
      password: hashedPassword,
      role: 'USER',
      status: 'ACTIVE',
      quotaPolicyId: defaultPolicy.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: '注册失败' }, { status: 500 });
  }
}
