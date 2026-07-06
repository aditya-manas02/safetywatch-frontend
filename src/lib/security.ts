import CryptoJS from "crypto-js";

// A static obfuscation key (since this is client side, it's not truly secure against 
// reverse engineering, but it completely defeats casual inspection).
const OBFUSCATION_KEY = "safetywatch-client-obfuscation-key-v1";
const PREFIX = "_sw_enc_";

/**
 * Initializes client-side security measures.
 * Call this as early as possible in the application lifecycle (e.g. main.tsx).
 */
export const initializeSecurity = () => {
  // Only apply aggressive security in production to allow development
  if (import.meta.env.MODE === "development") {
    console.log("[SECURITY] Development mode: Security measures bypassed.");
    return;
  }

  applyStorageEncryption();
  applyAntiDebugging();
  disableReactDevTools();
};

/**
 * Completely overrides the browser's native localStorage and sessionStorage
 * to automatically encrypt all data written to it, and decrypt upon read.
 */
const applyStorageEncryption = () => {
  const encrypt = (data: string): string => {
    try {
      return PREFIX + CryptoJS.AES.encrypt(data, OBFUSCATION_KEY).toString();
    } catch {
      return data;
    }
  };

  const decrypt = (data: string): string => {
    if (!data.startsWith(PREFIX)) return data; // Not encrypted by us
    try {
      const encryptedPart = data.replace(PREFIX, "");
      const bytes = CryptoJS.AES.decrypt(encryptedPart, OBFUSCATION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return data;
    }
  };

  // Override LocalStorage
  const originalLocalStorageSetItem = Storage.prototype.setItem;
  const originalLocalStorageGetItem = Storage.prototype.getItem;

  Storage.prototype.setItem = function (key: string, value: string) {
    originalLocalStorageSetItem.call(this, key, encrypt(value));
  };

  Storage.prototype.getItem = function (key: string) {
    const value = originalLocalStorageGetItem.call(this, key);
    if (value === null) return null;
    return decrypt(value);
  };
};

/**
 * Applies aggressive anti-debugging techniques to freeze the browser
 * or block common DevTools shortcuts.
 */
const applyAntiDebugging = () => {
  // 1. Disable Right Click
  document.addEventListener("contextmenu", (e) => e.preventDefault());

  // 2. Disable Keyboard Shortcuts (F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U)
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "F12" ||
      (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) ||
      (e.ctrlKey && (e.key === "U" || e.key === "u"))
    ) {
      e.preventDefault();
    }
  });

  // 3. The "Debugger Trap"
  // If DevTools is open, the browser will continuously pause execution here,
  // making it impossible to inspect elements or the network.
  setInterval(() => {
    const before = new Date().getTime();
    // eslint-disable-next-line no-debugger
    debugger;
    const after = new Date().getTime();
    // Optional: If the debugger was triggered (time difference is large), we could forcefully crash or redirect.
    if (after - before > 100) {
      // DevTools was likely open
    }
  }, 1000);
};

/**
 * Destroys the React DevTools hook if it exists.
 */
const disableReactDevTools = () => {
  if (typeof window !== "undefined" && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    try {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      for (const prop in hook) {
        if (typeof hook[prop] === "function") {
          hook[prop] = () => {}; // Stub out functions
        }
      }
    } catch (e) {
      // Ignore
    }
  }
};
