/**
 * Palette Export Tool
 * Convert a palette of colors into commonly used design-system formats:
 * CSS custom properties, SCSS variables, Tailwind config, or W3C design tokens.
 */

import { z } from "zod";

import { parseColor, rgbToHex, rgbToHsl } from "../color/index.js";

const FORMATS = ["css", "scss", "tailwind", "tokens", "json"] as const;

type ExportFormat = (typeof FORMATS)[number];

interface NamedColor {
  hex: string;
  name: string;
}

function asCss(items: NamedColor[]): string {
  const body = items.map(({ hex, name }) => `  --${name}: ${hex};`).join("\n");
  return `:root {\n${body}\n}\n`;
}

function asJson(items: NamedColor[]): string {
  const obj: Record<string, { hex: string; hsl: string; rgb: string }> = {};
  for (const { hex, name } of items) {
    const rgb = parseColor(hex)!;
    const hsl = rgbToHsl(rgb);
    obj[name] = {
      hex,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
    };
  }
  return JSON.stringify(obj, null, 2) + "\n";
}

function asScss(items: NamedColor[]): string {
  return items.map(({ hex, name }) => `$${name}: ${hex};`).join("\n") + "\n";
}

function asTailwind(items: NamedColor[], prefix?: string): string {
  const key = prefix ?? "palette";
  const lines = items
    .map(({ hex, name }) => {
      // Drop the prefix from the entry name if it was prefixed
      const entry =
        prefix && name.startsWith(`${prefix}-`)
          ? name.slice(prefix.length + 1)
          : name;
      return `      "${entry}": "${hex}",`;
    })
    .join("\n");
  return `// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        "${key}": {
${lines}
        },
      },
    },
  },
};
`;
}

function asTokens(items: NamedColor[], prefix?: string): string {
  // W3C Design Tokens Community Group format (draft).
  const group = prefix ?? "color";
  const obj: Record<string, unknown> = {
    [group]: Object.fromEntries(
      items.map(({ hex, name }) => {
        const entry =
          prefix && name.startsWith(`${prefix}-`)
            ? name.slice(prefix.length + 1)
            : name;
        return [entry, { $type: "color", $value: hex }];
      }),
    ),
  };
  return JSON.stringify(obj, null, 2) + "\n";
}

function defaultName(index: number): string {
  // Tailwind-style 50/100…900 scale up to 10 colors, then numeric.
  const scale = [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
  ];
  return scale[index] ?? String((index + 1) * 100);
}

function resolveNames(
  colors: string[],
  names?: string[],
  prefix?: string,
): NamedColor[] {
  return colors.map((c, i) => {
    const parsed = parseColor(c);
    if (!parsed) throw new Error(`Invalid color: ${c}`);
    const hex = rgbToHex(parsed);
    const raw = names?.[i] ?? defaultName(i);
    const slug = raw.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const name = prefix ? `${prefix}-${slug}` : slug;
    return { hex, name };
  });
}

export const exportPaletteTool = {
  description:
    "Export a list of colors as CSS custom properties, SCSS variables, a Tailwind config snippet, W3C design tokens, or JSON.",
  execute: async (args: {
    colors: string[];
    format: ExportFormat;
    names?: string[];
    prefix?: string;
  }) => {
    const { colors, format, names, prefix } = args;

    if (names && names.length !== colors.length) {
      return `Error: names array length (${names.length}) must match colors length (${colors.length}).`;
    }

    let items: NamedColor[];
    try {
      items = resolveNames(colors, names, prefix);
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }

    switch (format) {
      case "css":
        return asCss(items);
      case "json":
        return asJson(items);
      case "scss":
        return asScss(items);
      case "tailwind":
        return asTailwind(items, prefix);
      case "tokens":
        return asTokens(items, prefix);
    }
  },
  name: "export_palette",
  parameters: z.object({
    colors: z.array(z.string()).min(1).describe("Palette colors"),
    format: z
      .enum(FORMATS)
      .describe(
        "Output format: css (custom properties), scss (variables), tailwind (config), tokens (W3C design tokens), json",
      ),
    names: z
      .array(z.string())
      .optional()
      .describe(
        "Optional names for each color. Length must match colors. Defaults to a 50/100…900 scale.",
      ),
    prefix: z
      .string()
      .optional()
      .describe("Optional prefix for variable/token names (e.g. 'brand')"),
  }),
};
