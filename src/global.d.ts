declare module '*.css' {
  export default Record<string, string>;
}

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}

// 扩展 NextApiRequest 类型
// 通过全局命名空间扩展，而不是覆盖模块
export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      [key: string]: string | undefined;
    }
  }
}

declare module 'next' {
  interface NextApiRequest {
    clientIp?: string;
    region?: string;
  }
}
