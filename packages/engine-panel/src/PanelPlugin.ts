import type { MasterContainerBuilder, MasterContainerHook, Plugin } from '@contember/engine-http'
import { panelAssets } from './generated/assets.js'
import { PanelAssetStore } from './PanelAssets.js'
import { PanelController } from './PanelController.js'

const defaultBasePath = '/panel'

export class PanelPlugin implements Plugin {
	name = 'contember/panel'

	getMasterContainerHook(): MasterContainerHook {
		return (builder: MasterContainerBuilder) =>
			builder.setupService('application', (it, { serverConfig }) => {
				if (serverConfig.panel?.enabled !== true) {
					return
				}
				const basePath = normalizeBasePath(serverConfig.panel.path ?? defaultBasePath)
				const assets = new PanelAssetStore(panelAssets)
				if (assets.isEmpty()) {
					// A build-time mistake, not a configuration one: the server was bundled without running
					// the panel build. Fail here rather than serving a blank page.
					throw new Error(
						'CONTEMBER_PANEL_ENABLED is on, but this build contains no panel assets. Run `bun run --filter=@contember/engine-panel pre-build` before building the server.',
					)
				}
				const controller = new PanelController({
					basePath,
					apiBaseUrl: `${basePath}/api`,
					assets,
				})
				// Optional trailing group so both `/panel` and `/panel/anything` are served.
				it.addInternalRoute('panel', `${basePath}{/*path}`, controller.create())
			}) as unknown as MasterContainerBuilder
	}
}

const normalizeBasePath = (path: string): string => {
	const trimmed = path.trim().replace(/\/+$/, '')
	if (!trimmed.startsWith('/') || trimmed.length < 2) {
		throw new Error(`Invalid CONTEMBER_PANEL_PATH ${JSON.stringify(path)}: expecting an absolute path like "/panel".`)
	}
	return trimmed
}
