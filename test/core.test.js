import test from "node:test";
import assert from "node:assert/strict";
import { summary, validate, example } from "../src/core.js";
import { inspectPhoto } from "../src/photo.js";
test("extra parts do not conceal missing parts in another item line", () => {
  const kit = example().kits[0];
  kit.items[0].present = 20;
  const s = summary(kit);
  assert.deepEqual(s, { required: 15, present: 13, missing: 2, lines: 1 });
});
test("quantities reject fractional, boolean, negative, excessive and zero reference values", () => {
  for (const value of [true, 1.5, -1, 10000]) {
    const data = example();
    data.kits[0].items[0].present = value;
    assert.throws(() => validate(data));
  }
  const data = example();
  data.kits[0].items[0].required = 0;
  assert.throws(() => validate(data));
});
test("strict schema prevents malformed photos, duplicate ids and excessive items", () => {
  const data = example();
  data.kits[0].items.push(structuredClone(data.kits[0].items[0]));
  assert.throws(() => validate(data));
  assert.throws(() =>
    validate({ kits: [{ ...example().kits[0], unknown: true }] }),
  );
  assert.throws(() => inspectPhoto("data:image/png;base64,YWJjZA=="));
});
test("a fresh check can zero present counts without changing reference quantities or notes", () => {
  const kit = example().kits[0],
    before = structuredClone(kit);
  kit.items.forEach((i) => (i.present = 0));
  validate({ kits: [kit] });
  assert.equal(summary(kit).missing, 15);
  assert.deepEqual(
    kit.items.map((i) => [i.required, i.note]),
    before.items.map((i) => [i.required, i.note]),
  );
});
