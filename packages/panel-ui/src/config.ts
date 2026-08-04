/**
 * Configuration the engine injects into `index.html` when it serves the panel. Kept deliberately
 * small: everything else the panel needs it asks the API for.
 */
export interface PanelRuntimeConfig {
	/** Mount path, always with a trailing slash — `CONTEMBER_PANEL_PATH` plus `/`. */
	basePath: string
	/** Prefix for every API call; the per-API paths (`/tenant`, `/content/...`) are appended to it. */
	apiBaseUrl: string
}

const configElementId = 'contember-panel-config'
const placeholder = '__CONTEMBER_PANEL_CONFIG__'

/** Used by `vite dev`, where nothing substitutes the placeholders. */
const developmentConfig: PanelRuntimeConfig = {
	basePath: '/',
	apiBaseUrl: '/panel/api',
}

export const getPanelConfig = (): PanelRuntimeConfig => {
	const raw = document.getElementById(configElementId)?.textContent?.trim()
	if (!raw || raw === placeholder) {
		return developmentConfig
	}
	return JSON.parse(raw) as PanelRuntimeConfig
}
