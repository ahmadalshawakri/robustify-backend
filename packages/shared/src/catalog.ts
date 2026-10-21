/**
 * Materials the press buys and consumes. Purchases are counted in packs;
 * stock and consumption are counted in `unit`. `packSize` (units per pack)
 * comes from the original system. Type keys are stable identifiers stored in
 * the database, labels are for display.
 */
export const MATERIALS = {
  PAPER: {
    label: "Paper",
    unit: "m",
    packSize: 2200,
    types: {
      PPW_WHITE: "PPW White",
      PE_WHITE: "PE White",
      PPW_SILVER: "PPW Silver",
      PE_SILVER: "PE Silver",
      PPW_CLEAR: "PPW Clear",
      CLEAR_CLEAR: "Clear Clear",
      LASER: "Laser",
      SACHET_ALUMINUM: "Sachet Aluminum",
    },
  },
  INK: {
    label: "Ink",
    unit: "ml",
    packSize: 1200,
    types: {
      BLACK: "Black Ink",
      WHITE: "White Ink",
      CYAN: "Cyan Ink",
      MAGENTA: "Magenta Ink",
      YELLOW: "Yellow Ink",
    },
  },
  VARNISH: {
    label: "Varnish",
    unit: "ml",
    packSize: 3000,
    types: {
      STANDARD: "Varnish",
    },
  },
} as const;

export const MATERIAL_CATEGORIES = [
  "PAPER",
  "INK",
  "VARNISH",
] as const satisfies readonly (keyof typeof MATERIALS)[];
export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export type PaperType = keyof typeof MATERIALS.PAPER.types;
export const PAPER_TYPES = Object.keys(MATERIALS.PAPER.types) as [PaperType, ...PaperType[]];

/** All type keys valid for a category. */
export function materialTypes(category: MaterialCategory): string[] {
  return Object.keys(MATERIALS[category].types);
}

/** Display name of a material, e.g. "PPW White" or "Cyan Ink". */
export function materialLabel(category: MaterialCategory, materialType: string): string {
  const types: Record<string, string> = MATERIALS[category].types;
  return types[materialType] ?? materialType;
}
