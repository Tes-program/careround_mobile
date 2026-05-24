/// <reference types="nativewind/types" />

declare module '*.css' {
  const stylesheet: Record<string, string>;
  export default stylesheet;
}

declare var process: {
  env: Record<string, string | undefined>;
};
