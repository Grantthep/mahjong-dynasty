/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API URL. Leave empty in development (the Vite proxy is used). */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
