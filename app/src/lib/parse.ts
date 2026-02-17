import Parse from 'parse/dist/parse.min.js';

Parse.initialize(
  import.meta.env.VITE_BACK4APP_APP_ID,
  import.meta.env.VITE_BACK4APP_JS_KEY
);
(Parse as unknown as { serverURL: string }).serverURL = 'https://parseapi.back4app.com/';

export default Parse;
