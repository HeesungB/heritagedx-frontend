import config from "@heritage-dx/eslint-config";

export default [
  ...config,
  { ignores: [".next/**", "next-env.d.ts"] },
];
