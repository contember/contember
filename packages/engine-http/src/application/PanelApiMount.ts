import type { Application, HttpController } from './application.js'

export interface PanelApiMountArgs {
	/** Name the panel UI checks for before offering the module, e.g. `actions`. */
	readonly name: string
	/** Route mask relative to the panel's API root, e.g. `actions/:projectSlug`. */
	readonly path: string
	readonly controller: HttpController
}

/** What {@link PanelApiMount.mount} needs of the application it registers into. */
export type PanelApiMountTarget = Pick<Application, 'addRoute'>

/**
 * Lets a plugin serve its API from the panel's own mount instead of the public route.
 *
 * Declared here rather than in `@contember/engine-panel` so a plugin can mount into the panel
 * without depending on the panel package — the panel, in turn, knows nothing about the plugins.
 */
export interface PanelApiMount {
	/**
	 * Registers `<panel base path>/api/<path>` behind the panel's access gate, for authenticated
	 * callers only — the anonymous pre-sign-in surface is the panel's own tenant route and nothing
	 * else. Does nothing when no panel is served, so a plugin calls it unconditionally.
	 */
	mount(application: PanelApiMountTarget, args: PanelApiMountArgs): void
}

/** The default: no panel is served, so there is nothing to mount into. */
export class DisabledPanelApiMount implements PanelApiMount {
	public mount(): void {
	}
}
