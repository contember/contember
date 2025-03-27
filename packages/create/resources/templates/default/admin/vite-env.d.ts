/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_CONTEMBER_ADMIN_API_BASE_URL: string
	readonly VITE_CONTEMBER_ADMIN_SESSION_TOKEN: string
	readonly VITE_CONTEMBER_ADMIN_LOGIN_TOKEN: string
	readonly VITE_CONTEMBER_ADMIN_PROJECT_NAME: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
