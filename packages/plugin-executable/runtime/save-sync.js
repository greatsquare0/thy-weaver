/**
 * ThyWeaver save sync, injected by @thy-weaver/plugin-executable
 *
 * Mirrors the game's localStorage to <user data dir>/<applicationId>/<fileName>
 * so saves survive port/origin changes, reinstalls and can be backed up.
 *
 * Must run before the story format, at the very top of <head>.
 * Reads its options from window.__THYWEAVER_SAVE_SYNC__ = { fileName }.
 */
(() => {
  const options = window.__THYWEAVER_SAVE_SYNC__ || {};
  const FILE_NAME = options.fileName || "saves.json";
  const BASE_NAME = FILE_NAME.replace(/\.json$/i, "");
  const BACKUP_NAME = `${BASE_NAME}.bak.json`;
  const TMP_NAME = `${BASE_NAME}.tmp.json`;
  const META_KEY = "__thyweaver_sync_updated_at";
  const RELOAD_FLAG = "__thyweaver_sync_reloaded";
  const DEBOUNCE_MS = 250;
  const REVEAL_TIMEOUT_MS = 4000;

  const log = (...args) => console.log("[save-sync]", ...args);

  const storage = window.localStorage;
  const proto = Storage.prototype;
  const original = {
    getItem: proto.getItem,
    setItem: proto.setItem,
    removeItem: proto.removeItem,
    clear: proto.clear,
  };

  // Hide the page until we know if a reload is needed, avoids a flash
  const hideStyle = document.createElement("style");
  hideStyle.textContent = "html{visibility:hidden!important}";
  document.head.prepend(hideStyle);
  const reveal = () => hideStyle.remove();
  setTimeout(reveal, REVEAL_TIMEOUT_MS);

  const state = {
    ready: false,
    changedBeforeReady: false,
    timer: null,
    writing: Promise.resolve(),
    dir: null,
    lastWrite: null,
    lastData: null,
  };
  window.__thyweaverSaveSync = state;

  const snapshot = () => {
    const data = {};
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key !== META_KEY) data[key] = original.getItem.call(storage, key);
    }
    return data;
  };

  const localUpdatedAt = () =>
    Number(original.getItem.call(storage, META_KEY) || 0);

  const sameData = (a, b) => {
    const keysA = Object.keys(a);
    if (keysA.length !== Object.keys(b).length) return false;
    return keysA.every((key) => a[key] === b[key]);
  };

  const path = (name) => Neutralino.filesystem.getJoinedPath(state.dir, name);

  const writeToDisk = () => {
    state.writing = state.writing.then(async () => {
      const payload = {
        version: 1,
        updatedAt: localUpdatedAt(),
        data: snapshot(),
      };
      const serializedData = JSON.stringify(payload.data);
      if (serializedData === state.lastData) return;
      const file = await path(FILE_NAME);
      const tmp = await path(TMP_NAME);
      const backup = await path(BACKUP_NAME);

      // Write a temp file first, so a crash never leaves a half written save
      await Neutralino.filesystem.writeFile(tmp, JSON.stringify(payload));
      await Neutralino.filesystem.remove(backup).catch(() => {});
      await Neutralino.filesystem.move(file, backup).catch(() => {});
      await Neutralino.filesystem.move(tmp, file);

      state.lastWrite = payload.updatedAt;
      state.lastData = serializedData;
      log("saved to disk", Object.keys(payload.data).length, "keys");
    });

    return state.writing.catch((error) => log("write failed", error));
  };

  const scheduleWrite = () => {
    clearTimeout(state.timer);
    state.timer = setTimeout(writeToDisk, DEBOUNCE_MS);
  };

  const onChange = () => {
    // Writes made while booting (before the disk is read) must not be
    // timestamped, or they would look newer than the saves on disk
    if (!state.ready) {
      state.changedBeforeReady = true;
      return;
    }
    original.setItem.call(storage, META_KEY, String(Date.now()));
    scheduleWrite();
  };

  proto.setItem = function (key, value) {
    original.setItem.call(this, key, value);
    if (this === storage && key !== META_KEY) onChange();
  };
  proto.removeItem = function (key) {
    original.removeItem.call(this, key);
    if (this === storage && key !== META_KEY) onChange();
  };
  proto.clear = function () {
    original.clear.call(this);
    if (this === storage) onChange();
  };

  const readDisk = async () => {
    for (const name of [FILE_NAME, BACKUP_NAME]) {
      try {
        const parsed = JSON.parse(
          await Neutralino.filesystem.readFile(await path(name)),
        );
        if (parsed && parsed.version === 1 && parsed.data) return parsed;
      } catch {
        // Missing or corrupted, try the next one
      }
    }
    return null;
  };

  const startup = async () => {
    const dataDir = await Neutralino.os.getPath("data");
    state.dir = await Neutralino.filesystem.getJoinedPath(dataDir, NL_APPID);
    await Neutralino.filesystem.createDirectory(state.dir).catch(() => {});
    log("save dir", state.dir);

    const disk = await readDisk();
    const local = snapshot();
    if (disk) state.lastData = JSON.stringify(disk.data);
    const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === "1";
    sessionStorage.removeItem(RELOAD_FLAG);

    if (
      disk &&
      disk.updatedAt > localUpdatedAt() &&
      !sameData(disk.data, local) &&
      !alreadyReloaded
    ) {
      log("disk is newer, restoring and reloading");
      original.clear.call(storage);
      for (const [key, value] of Object.entries(disk.data)) {
        original.setItem.call(storage, key, value);
      }
      original.setItem.call(storage, META_KEY, String(disk.updatedAt));
      sessionStorage.setItem(RELOAD_FLAG, "1");
      location.reload();
      return;
    }

    state.ready = true;
    reveal();

    if (!disk || localUpdatedAt() > disk.updatedAt) {
      log("local is newer (or no file yet), writing to disk");
      if (state.changedBeforeReady || !localUpdatedAt()) {
        original.setItem.call(storage, META_KEY, String(Date.now()));
      }
      await writeToDisk();
    } else if (state.changedBeforeReady) {
      onChange();
    } else {
      log("in sync");
    }
  };

  const flushAndExit = async () => {
    clearTimeout(state.timer);
    if (state.ready && state.lastWrite !== localUpdatedAt()) {
      await writeToDisk();
    }
    await state.writing.catch(() => {});
    Neutralino.app.exit();
  };

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.Neutralino || !window.NL_PORT) {
      log("not running inside Neutralino, sync disabled");
      reveal();
      return;
    }

    Neutralino.init();
    Neutralino.events.on("windowClose", flushAndExit);
    Neutralino.events.on("ready", () =>
      startup().catch((error) => {
        log("startup failed", error);
        state.ready = true;
        reveal();
      }),
    );
  });
})();
