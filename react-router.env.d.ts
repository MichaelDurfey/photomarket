/// <reference types="@react-router/dev" />
/// <reference types="@react-router/node" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
