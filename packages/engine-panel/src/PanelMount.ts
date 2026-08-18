import type { PanelApiMount, PanelApiMountArgs, PanelApiMountTarget } from '@contember/engine-http'
import type { PanelApiControllerFactory } from './PanelApiController.js'
import type { PanelAssetStore } from './PanelAssets.js'

/**
 * Everything needed to serve the panel, resolved once. It exists only when the panel really is
 * served — enabled *and* built into this binary — so a plugin can read "this resolved" as "there is
 * a panel to mount into" and skip its panel route otherwise.
 */
export class PanelMount implements PanelApiMount {
	private readonly pluginApiNames = new Set<string>()

	constructor(
		public readonly basePath: string,
		public readonly assets: PanelAssetStore,
		/** Shared with the panel's own routes: one factory means one access-check cache for all of them. */
		public readonly api: PanelApiControllerFactory,
	) {
	}

	public mount(application: PanelApiMountTarget, { name, path, controller }: PanelApiMountArgs): void {
		application.addRoute('panel-api', `${this.basePath}/api/${path}`, this.api.create(controller, { allowAnonymous: false }))
		this.pluginApiNames.add(name)
	}

	/**
	 * APIs plugins have mounted, reported to the UI so a module can hide itself when the plugin that
	 * backs it is not installed. Read when the shell is rendered, not when it is constructed, so a
	 * plugin registering after the panel is still counted.
	 */
	public get pluginApis(): readonly string[] {
		return [...this.pluginApiNames].sort()
	}
}
