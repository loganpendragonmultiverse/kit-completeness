import { summary, validate } from "./core.js";
import {
  $,
  el,
  button,
  field,
  message,
  uid,
  clone,
  vault,
  save,
  setup,
  markDirty,
  leaveDraft,
  readPhoto,
} from "./ui.js";
let selected = null,
  draft = null,
  inputs = {},
  itemInputs = [],
  lastDelete = null,
  query = "",
  editorRevision = 0,
  pendingPhotos = new Map();
function refresh() {
  if (!vault.data.kits.some((k) => k.id === selected))
    selected = vault.data.kits[0]?.id || null;
  draft = clone(vault.data.kits.find((k) => k.id === selected) || null);
  renderNav();
  renderEditor();
  renderSaved();
}
function renderNav() {
  const host = $("records");
  host.replaceChildren();
  for (const kit of vault.data.kits.filter((k) =>
    `${k.name} ${k.notes} ${k.items.map((i) => i.name).join(" ")}`
      .toLowerCase()
      .includes(query),
  )) {
    const s = summary(kit),
      b = button(
        kit.name,
        () => {
          if (!leaveDraft()) return;
          selected = kit.id;
          markDirty(false);
          refresh();
        },
        selected === kit.id ? "secondary selected" : "secondary",
      );
    b.append(
      el(
        "small",
        kit.items.length
          ? `${s.missing} missing · ${kit.items.length} item types`
          : "No items yet",
      ),
    );
    host.append(b);
  }
  if (!host.children.length)
    host.append(
      el(
        "p",
        query
          ? "No kits match your search."
          : "No kits saved. Start your own or try the example.",
        "hint",
      ),
    );
}
function capture() {
  if (!draft) return;
  draft.name = inputs.name.value;
  draft.notes = inputs.notes.value;
  draft.items = itemInputs.map(({ item, fields }) => ({
    ...item,
    name: fields.name.value,
    required: Number(fields.required.value),
    present: Number(fields.present.value),
    note: fields.note.value,
  }));
}
function newKit() {
  if (!leaveDraft()) return;
  selected = null;
  draft = { id: uid(), name: "", notes: "", items: [] };
  markDirty();
  renderNav();
  renderEditor();
  renderSaved();
  inputs.name.focus();
}
function renderEditor() {
  const revision = ++editorRevision;
  pendingPhotos.clear();
  const host = $("editor");
  host.replaceChildren();
  if (!draft) {
    host.append(
      el(
        "div",
        "Build a reusable contents list, then count what is actually in the kit.",
        "empty",
      ),
    );
    return;
  }
  const header = el("div", undefined, "section-title");
  header.append(el("h2", selected ? "Edit kit" : "New kit"));
  host.append(header);
  const form = el("form");
  inputs = {};
  for (const [key, label, max, multiline] of [
    ["name", "Kit name", 120, false],
    ["notes", "Kit notes / storage location", 4000, true],
  ]) {
    const f = field(label, {
      value: draft[key],
      max,
      multiline,
      required: key === "name",
    });
    inputs[key] = f.input;
    form.append(f.wrap);
  }
  form.append(
    el(
      "p",
      "Required is your reference count. Present is the quantity you have checked. Extra items are kept in the count but do not hide missing items elsewhere.",
      "hint",
    ),
  );
  itemInputs = [];
  for (const [index, item] of draft.items.entries()) {
    const row = el("fieldset", undefined, "entry");
    row.append(el("legend", `Item ${index + 1}`));
    const grid = el("div", undefined, "fields");
    const fields = {
      name: field("Item name", { value: item.name, max: 120, required: true }),
      required: field("Required quantity", {
        value: item.required,
        type: "number",
        min: 1,
        step: 1,
        required: true,
      }),
      present: field("Present quantity", {
        value: item.present,
        type: "number",
        min: 0,
        step: 1,
        required: true,
      }),
      note: field("Reference note / location", { value: item.note, max: 4000 }),
    };
    for (const f of Object.values(fields)) grid.append(f.wrap);
    row.append(grid);
    itemInputs.push({
      item,
      fields: Object.fromEntries(
        Object.entries(fields).map(([k, f]) => [k, f.input]),
      ),
    });
    const photoHost = el("div");
    const showPhoto = () => {
      photoHost.replaceChildren();
      if (item.photo) {
        const image = el("img", undefined, "item-photo");
        image.src = item.photo;
        image.alt = `Reference photo for ${item.name || "kit item"}`;
        photoHost.append(image);
      }
    };
    showPhoto();
    const file = field("Reference photo (PNG, JPEG or WebP, under 1.4 MB)", {
      type: "file",
    });
    file.input.accept = "image/png,image/jpeg,image/webp";
    let photoEpoch = 0;
    file.input.onchange = async () => {
      const epoch = ++photoEpoch;
      pendingPhotos.set(item.id, epoch);
      try {
        const chosen = file.input.files[0];
        if (!chosen) return;
        const photo = await readPhoto(chosen);
        if (revision !== editorRevision || epoch !== photoEpoch) return;
        capture();
        draft.items[index].photo = photo;
        item.photo = photo;
        markDirty();
        showPhoto();
      } catch (e) {
        if (revision === editorRevision && epoch === photoEpoch)
          message(e.message, true);
      } finally {
        if (revision === editorRevision && epoch === photoEpoch) {
          pendingPhotos.delete(item.id);
          file.input.value = "";
        }
      }
    };
    const actions = el("div", undefined, "actions");
    actions.append(
      button("Mark full quantity present", () => {
        fields.present.input.value = fields.required.input.value;
        markDirty();
      }),
      button("Remove photo", () => {
        photoEpoch++;
        pendingPhotos.delete(item.id);
        file.input.value = "";
        item.photo = null;
        capture();
        draft.items[index].photo = null;
        showPhoto();
        markDirty();
      }),
      button(
        "Remove item",
        () => {
          capture();
          if (
            !confirm(
              `Remove ${draft.items[index].name || "this item"} from the draft?`,
            )
          )
            return;
          draft.items.splice(index, 1);
          markDirty();
          renderEditor();
        },
        "danger",
      ),
    );
    row.append(photoHost, file.wrap, actions);
    form.append(row);
  }
  const actions = el("div", undefined, "actions");
  actions.append(
    button("Add item", () => {
      capture();
      if (draft.items.length >= 300)
        throw new Error("One kit supports up to 300 item types.");
      draft.items.push({
        id: uid(),
        name: "",
        required: 1,
        present: 0,
        note: "",
        photo: null,
      });
      markDirty();
      renderEditor();
      itemInputs.at(-1).fields.name.focus();
    }),
  );
  const submit = el("button", "Save kit");
  submit.type = "submit";
  actions.append(
    submit,
    button("Discard draft changes", () => {
      if (!leaveDraft()) return;
      markDirty(false);
      refresh();
    }),
  );
  if (selected)
    actions.append(
      button(
        "Delete kit",
        () => {
          if (
            !confirm(
              "Delete this saved kit? Undo is available until another save, restore or reload.",
            )
          )
            return;
          const before = vault.data,
            next = vault.data;
          next.kits = next.kits.filter((k) => k.id !== selected);
          save(next);
          lastDelete = { data: before, basis: vault.raw };
          $("undo").hidden = false;
          selected = null;
          refresh();
        },
        "danger",
      ),
    );
  form.append(actions);
  form.oninput = () => markDirty();
  form.onsubmit = (e) => {
    e.preventDefault();
    try {
      if (pendingPhotos.size)
        throw new Error(
          "Wait for selected photos to finish preparing before saving.",
        );
      capture();
      const next = vault.data,
        index = next.kits.findIndex((k) => k.id === draft.id);
      if (index < 0) next.kits.push(clone(draft));
      else next.kits[index] = clone(draft);
      validate(next);
      save(next);
      selected = draft.id;
      refresh();
    } catch (e) {
      message(e.message, true);
    }
  };
  host.append(form);
}
function renderSaved() {
  const host = $("preview"),
    print = $("print-sheet");
  host.replaceChildren();
  print.replaceChildren(el("h1", "Kit completeness checklist"));
  const kit = vault.data.kits.find((k) => k.id === selected);
  if (!kit) {
    print.append(el("p", "No kit selected."));
    return;
  }
  const s = summary(kit);
  host.append(
    el("h2", kit.name),
    el(
      "p",
      "Saved contents. Save editor changes to update this checklist.",
      "hint",
    ),
  );
  const stats = el("div", undefined, "summary");
  for (const [value, label] of [
    [s.required, "required"],
    [s.present, "accounted for"],
    [s.missing, "missing"],
  ]) {
    const box = el("div");
    box.append(el("strong", value), el("span", label));
    stats.append(box);
  }
  host.append(stats);
  if (!kit.items.length)
    host.append(el("p", "No items in this reference list yet.", "hint"));
  const actions = el("div", undefined, "actions");
  actions.append(
    button("Reset all present counts to zero", () => {
      if (!leaveDraft()) return;
      if (
        !confirm(
          "Reset the saved present counts to zero for a fresh check? The reference quantities and photos stay in place.",
        )
      )
        return;
      const before = vault.data,
        next = vault.data;
      next.kits
        .find((k) => k.id === selected)
        .items.forEach((i) => (i.present = 0));
      save(next);
      lastDelete = { data: before, basis: vault.raw };
      $("undo").hidden = false;
      refresh();
    }),
  );
  host.append(actions);
  const list = el("div");
  for (const item of kit.items) {
    const row = el("div", undefined, "entry");
    row.append(el("h3", item.name));
    const missing = Math.max(0, item.required - item.present);
    row.append(
      el(
        "span",
        missing ? `${missing} missing` : "Complete",
        missing ? "pill warning" : "pill",
      ),
      el("span", `${item.present} present / ${item.required} required`, "pill"),
    );
    if (item.note) row.append(el("p", item.note));
    if (item.photo) {
      const img = el("img", undefined, "item-photo");
      img.src = item.photo;
      img.alt = `Reference photo for ${item.name}`;
      row.append(img);
    }
    list.append(row);
  }
  host.append(list);
  print.append(
    el("h2", kit.name),
    el("p", kit.notes),
    el(
      "p",
      `${s.required} required · ${s.present} accounted for · ${s.missing} missing`,
    ),
  );
  const printed = list.cloneNode(true);
  print.append(
    printed,
    el("p", "Check date: __________________  Checked by: __________________"),
  );
}
$("new").onclick = newKit;
$("search").oninput = (e) => {
  query = e.target.value.toLowerCase();
  renderNav();
};
$("undo").onclick = () => {
  try {
    if (!lastDelete || !leaveDraft()) return;
    if (vault.raw !== lastDelete.basis) {
      lastDelete = null;
      $("undo").hidden = true;
      throw new Error(
        "Undo is no longer available after another save or restore. Your newer saved data has been kept.",
      );
    }
    save(lastDelete.data);
    lastDelete = null;
    $("undo").hidden = true;
    refresh();
  } catch (e) {
    message(e.message, true);
  }
};
setup(refresh, (data) => `${data.kits.length} records`);
