import { validateSnapshot } from "./model.mjs";
const DB = "wizard-compendium-character-lab-v1";
export async function openLab() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      db.createObjectStore("snapshots", { keyPath: "id" }).createIndex(
        "character_id",
        "character_id",
      );
      db.createObjectStore("characters", { keyPath: "id" });
      db.createObjectStore("documents");
      db.createObjectStore("settings");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        Error(
          "Local storage is unavailable. Allow site storage or use a different browser profile.",
        ),
      );
  });
}
async function read(store, key) {
  const db = await openLab();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store);
    const r =
      key === undefined
        ? tx.objectStore(store).getAll()
        : tx.objectStore(store).get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(Error("Could not read local Character Lab data."));
    tx.oncomplete = () => db.close();
    tx.onabort = () => db.close();
  });
}
export const listCharacters = () => read("characters");
export const getSnapshot = (id) => read("snapshots", id);
export const getDocument = (id) => read("documents", id);
export async function history(id) {
  return (await read("snapshots"))
    .filter((s) => s.character_id === id)
    .sort((a, b) => b.revision - a.revision);
}
export async function activeSnapshot() {
  const active = await read("settings", "active");
  return active ? getSnapshot(active) : null;
}
export async function selectSnapshot(id) {
  const db = await openLab();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["snapshots", "settings"], "readwrite");
    const req = tx.objectStore("snapshots").get(id);
    req.onsuccess = () => {
      if (!req.result) {
        tx.abort();
        return;
      }
      tx.objectStore("settings").put(id, "active");
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(Error("Snapshot not found."));
    };
  });
}
export async function saveSnapshot(
  snapshot,
  blob = null,
  { allowDuplicate = false } = {},
) {
  if (!validateSnapshot(snapshot))
    throw Error("Invalid Character Lab snapshot. Nothing was saved.");
  if (snapshot.source.retained !== Boolean(blob))
    throw Error("PDF retention choice does not match the stored document.");
  const db = await openLab();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ["snapshots", "characters", "documents", "settings"],
      "readwrite",
    );
    let failure =
      "Local storage could not save the snapshot. Your review remains on this page.";
    const chars = tx.objectStore("characters"),
      snapshots = tx.objectStore("snapshots");
    const request = chars.get(snapshot.character_id);
    request.onsuccess = () => {
      const character = request.result;
      if (
        (character?.latest ?? null) !== snapshot.previous_snapshot_ref ||
        snapshot.revision !== (character?.revision ?? 0) + 1
      ) {
        failure =
          "Another tab saved a newer snapshot. Reload this page before importing again; no history was overwritten.";
        tx.abort();
        return;
      }
      const duplicate = snapshots
        .index("character_id")
        .getAll(snapshot.character_id);
      duplicate.onsuccess = () => {
        if (
          !allowDuplicate &&
          snapshot.source.sha256 &&
          duplicate.result.some(
            (s) => s.source.sha256 === snapshot.source.sha256,
          )
        ) {
          failure =
            "This PDF has already been imported for this character. Review the existing snapshot or explicitly save a corrected revision.";
          tx.abort();
          return;
        }
        snapshots.add(snapshot);
        chars.put({
          id: snapshot.character_id,
          name: snapshot.name,
          latest: snapshot.id,
          revision: snapshot.revision,
        });
        if (blob) tx.objectStore("documents").add(blob, snapshot.id);
        tx.objectStore("settings").put(snapshot.id, "active");
      };
    };
    tx.oncomplete = () => {
      db.close();
      window.dispatchEvent(new Event("character-lab-updated"));
      resolve(snapshot);
    };
    tx.onabort = () => {
      db.close();
      reject(Error(failure));
    };
    tx.onerror = () => {};
  });
}
export async function forgetCharacter(id) {
  const db = await openLab();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      ["snapshots", "characters", "documents", "settings"],
      "readwrite",
    );
    const req = tx.objectStore("snapshots").index("character_id").getAll(id);
    req.onsuccess = () => {
      const ids = req.result.map((s) => s.id);
      for (const key of ids) {
        tx.objectStore("snapshots").delete(key);
        tx.objectStore("documents").delete(key);
      }
      tx.objectStore("characters").delete(id);
      const active = tx.objectStore("settings").get("active");
      active.onsuccess = () => {
        if (ids.includes(active.result))
          tx.objectStore("settings").delete("active");
      };
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(Error("Could not remove the local character."));
    };
  });
}
