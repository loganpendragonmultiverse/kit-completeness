import { inspectPhoto } from "./photo.js";
export const APP = "kit-completeness";
export function object(value, keys) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).some((k) => !keys.includes(k))
  )
    throw new Error("Unexpected record structure.");
}
export function text(value, label, max = 4000, required = false) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim())
  )
    throw new Error(
      `${label} must be ${required ? "nonempty text" : "text"} up to ${max} characters.`,
    );
  return value;
}
export function photo(value) {
  inspectPhoto(value);
  return value;
}
export function quantity(value, label) {
  if (!Number.isInteger(value) || value < 0 || value > 9999)
    throw new Error(`${label} must be a whole number from 0 to 9999.`);
  return value;
}
export function item(p) {
  object(p, ["id", "name", "required", "present", "note", "photo"]);
  text(p.id, "Identifier", 80, true);
  text(p.name, "Item name", 120, true);
  text(p.note, "Item note");
  quantity(p.required, "Required quantity");
  if (p.required === 0)
    throw new Error("Required quantity must be at least 1.");
  quantity(p.present, "Present quantity");
  photo(p.photo);
  return p;
}
export function validate(data) {
  object(data, ["kits"]);
  if (!Array.isArray(data.kits) || data.kits.length > 100)
    throw new Error("Keep up to 100 kits per backup.");
  for (const k of data.kits) {
    object(k, ["id", "name", "notes", "items"]);
    text(k.id, "Identifier", 80, true);
    text(k.name, "Kit name", 120, true);
    text(k.notes, "Kit notes");
    if (!Array.isArray(k.items) || k.items.length > 300)
      throw new Error("Keep up to 300 items in one kit.");
    k.items.forEach(item);
    if (new Set(k.items.map((i) => i.id)).size !== k.items.length)
      throw new Error("Duplicate item identifiers.");
  }
  if (new Set(data.kits.map((k) => k.id)).size !== data.kits.length)
    throw new Error("Duplicate kit identifiers.");
  return data;
}
export function summary(kit) {
  return kit.items.reduce(
    (s, i) => ({
      required: s.required + i.required,
      present: s.present + Math.min(i.required, i.present),
      missing: s.missing + Math.max(0, i.required - i.present),
      lines: s.lines + (i.present < i.required ? 1 : 0),
    }),
    { required: 0, present: 0, missing: 0, lines: 0 },
  );
}
export const empty = () => ({ kits: [] });
export const example = () => ({
  kits: [
    {
      id: "example-kit",
      name: "Weekend camping box",
      notes:
        "Example list. Adapt it to your trip and check your equipment separately.",
      items: [
        {
          id: "pegs",
          name: "Tent pegs",
          required: 12,
          present: 10,
          note: "Small red bag",
          photo: null,
        },
        {
          id: "lamp",
          name: "Lantern",
          required: 1,
          present: 1,
          note: "Check operation before leaving",
          photo: null,
        },
        {
          id: "mugs",
          name: "Mugs",
          required: 2,
          present: 0,
          note: "Side pocket",
          photo: null,
        },
      ],
    },
  ],
});
