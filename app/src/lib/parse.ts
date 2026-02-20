import ParseModule from 'parse/dist/parse.min.js';

// Vite dev server wraps the UMD bundle in an ESM shim where the actual
// Parse object may be on `.default` or directly on the module, or it may
// end up on globalThis.Parse (UMD side-effect).  Production builds via
// Rollup resolve correctly to the Parse object.
type ParseType = typeof ParseModule;
const mod = ParseModule as unknown as Record<string, unknown>;
const resolved =
  typeof mod.initialize === 'function' ? mod :
  typeof (mod.default as Record<string, unknown>)?.initialize === 'function' ? mod.default :
  (globalThis as unknown as Record<string, unknown>).Parse;

if (!resolved || typeof (resolved as Record<string, unknown>).initialize !== 'function') {
  throw new Error('Failed to load Parse SDK: initialize() not found on module, module.default, or globalThis.Parse');
}

const Parse = resolved as ParseType;

Parse.initialize(
  import.meta.env.VITE_BACK4APP_APP_ID,
  import.meta.env.VITE_BACK4APP_JS_KEY
);
(Parse as unknown as { serverURL: string }).serverURL = 'https://parseapi.back4app.com/';

export default Parse;
