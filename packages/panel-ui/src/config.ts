/**
 * Configuration the engine injects into `index.html` when it serves the panel. Kept deliberately
 * small: everything else the panel needs it asks the API for.
 */
export interface PanelRuntimeConfig {
	/** Mount path, always with a trailing slash — `CONTEMBER_PANEL_PATH` plus `/`. */
	basePath: string
	/** Prefix for every API call; the per-API paths (`/tenant`, `/content/...`) are appended to it. */
	apiBaseUrl: string
	/**
	 * APIs plugins have mounted under {@link apiBaseUrl}, e.g. `actions`. Tenant, content and system
	 * are always there and are not listed. A module whose plugin is missing hides itself.
	 */
	pluginApis: readonly string[]
}

const configElementId = 'contember-panel-config'
const placeholder = '__CONTEMBER_PANEL_CONFIG__'

/**
 * Used by `vite dev`, where nothing substitutes the placeholders. Every plugin API is listed: a
 * module under development must be reachable, and hiding one is nav tidiness rather than a boundary.
 */
const developmentConfig: PanelRuntimeConfig = {
	basePath: '/',
	apiBaseUrl: '/panel/api',
	pluginApis: ['actions'],
}

export const getPanelConfig = (): PanelRuntimeConfig => {
	const raw = document.getElementById(configElementId)?.textContent?.trim()
	if (!raw || raw === placeholder) {
		return developmentConfig
	}
	return JSON.parse(raw) as PanelRuntimeConfig
}
