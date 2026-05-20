import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import perfectionist from "eslint-plugin-perfectionist";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  perfectionist.configs["recommended-alphabetical"],
  eslintConfigPrettier,
  {
    ignores: ["**/*.js", "dist/**"],
  },
  {
    // Vendored Material Color Utilities use the "declare-then-assign-in-loop"
    // pattern liberally; that conflicts with ESLint 10's new no-useless-assignment.
    files: [
      "src/color/quantize/**",
      "src/color/utils/color_utils.ts",
      "src/color/hct/**",
      "src/color/score/**",
    ],
    rules: {
      "no-useless-assignment": "off",
    },
  },
);
