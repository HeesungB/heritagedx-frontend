import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "dist/**",
      "node_modules/**",
      ".turbo/**",
      "next-env.d.ts",
    ],
  },
  // ─── 뷰 레이어 역전 차단 (0-10) ───────────────────────────────
  {
    files: ["**/src/components/**/*.ts", "**/src/components/**/*.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@heritage-dx/types", "@heritage-dx/types/*"],
              message:
                "뷰에서 DTO(@heritage-dx/types) 직접 import 금지. @heritage-dx/store 의 Entity 를 사용하세요.",
            },
            {
              group: ["@heritage-dx/api-client", "@heritage-dx/api-client/*"],
              message:
                "뷰에서 raw ApiClient 직접 사용 금지. 훅(@heritage-dx/store/hooks) 또는 Repository Context 를 통해 호출하세요.",
            },
            {
              group: ["**/mappers/*", "**/normalizers/*", "**/repositories/*"],
              message:
                "뷰에서 mappers/normalizers/repositories 내부 경로 import 금지. 공개 훅을 사용하세요.",
            },
          ],
        },
      ],
    },
  },
];

export default config;
