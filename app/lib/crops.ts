export const COMMON_CROPS = [
  "Winter Wheat",
  "Spring Wheat",
  "Winter Barley",
  "Spring Barley",
  "Maize",
  "Oilseed Rape",
  "Potatoes",
  "Soybeans",
  "Oats",
  "Rye",
  "Triticale",
  "Sugar Beet",
  "Peas",
  "Beans",
  "Sunflowers",
  "Alfalfa",
  "Grass",
  "Grapes",
  "Apples",
  "Other",
] as const;

export function cropOptions(cropModels: { crop: string }[]): string[] {
  const userCrops = cropModels.map((cm) => cm.crop);
  const all = [...COMMON_CROPS, ...userCrops];
  return [...new Set(all)];
}
