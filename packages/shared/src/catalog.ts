/**
 * Materials the press buys and consumes. `packSize` is the standard pack size
 * carried over from the original system; type keys are stable identifiers
 * stored in the database, labels are for display.
 */
export const MATERIALS = {
  PAPER: {
    label: "Paper",
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
    packSize: 3000,
    types: {
      STANDARD: "Varnish",
    },
  },
} as const;

export type MaterialCategory = keyof typeof MATERIALS;
export const MATERIAL_CATEGORIES = Object.keys(MATERIALS) as MaterialCategory[];

export type PaperType = keyof typeof MATERIALS.PAPER.types;
export const PAPER_TYPES = Object.keys(MATERIALS.PAPER.types) as PaperType[];

/** All type keys valid for a category. */
export function materialTypes(category: MaterialCategory): string[] {
  return Object.keys(MATERIALS[category].types);
}
