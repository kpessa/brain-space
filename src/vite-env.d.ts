/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GOOGLE_CALENDAR_DISCOVERY_DOC: string
  readonly VITE_GOOGLE_CALENDAR_SCOPES: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
