declare module '*.css' {
  export default Record<string, any>;
}

declare module '*.json' {
  const value: Record<string, unknown>;
  export default value;
}
