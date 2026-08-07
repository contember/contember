import type { MasterContainerBuilder, MasterContainerHook, Plugin } from '@contember/engine-http'
import { panelAssets } from './generated/assets.js'
import { ConfiguredPanelAccessCheck } from './PanelAccessCheck.js'
import { PanelApiControllerFactory } from './PanelApiController.js'
import { PanelAssetStore } from './PanelAssets.js'
import { PanelController } from './PanelController.js'
import { PanelMount } from './PanelMount.js'

const defaultBasePath = '/panel'

export class PanelPlugin implements Plugin {
	name = 'contember/panel'

	getMasterContainerHook(): MasterContainerHook {
		return (builder: MasterContainerBuilder) =>
			builder
				.replaceService('panelApiMount', ({ serverConfig, logger, inner }) => {
					if (serverConfig.panel?.enabled !== true) {
						return inner
					}
					const assets = new PanelAssetStore(panelAssets)
					if (assets.isEmpty()) {
						// Running from source without the build step. A released build cannot get here —
						// `scripts/buildAssets.ts` fails when the panel produced nothing — so this is a
						// developer's checkout, and refusing to start would be a poor trade.
						logger.error(
							new Error(
								'The panel is enabled but this build contains no panel assets — run `bun run --filter=@contember/engine-panel build:assets`. Not serving the panel.',
							),
						)
						return inner
					}
					const basePath = normalizeBasePath(serverConfig.panel.path ?? defaultBasePath)
					return new PanelMount(basePath, assets, new PanelApiControllerFactory(new ConfiguredPanelAccessCheck()))
				})
				.setupService(
					'application',
					(it, { panelApiMount, tenantApiMiddlewareFactory, contentApiMiddlewareFactory, systemApiMiddlewareFactory }) => {
						if (!(panelApiMount instanceof PanelMount)) {
							return
						}
						const { basePath, api } = panelApiMount

						// The panel's own API mount, mirroring the public paths so the client's existing URL
						// building (`${apiBaseUrl}${path}`) needs no special cases. Only tenant takes anonymous
						// callers — it is the one the sign-in screen talks to before there is a session.
						// Content and system have no pre-sign-in consumer.
						it.addRoute('panel-api', `${basePath}/api/tenant`, api.create(tenantApiMiddlewareFactory.create(), { allowAnonymous: true }))
						it.addRoute(
							'panel-api',
							`${basePath}/api/content/:projectSlug/:stageSlug`,
							api.create(contentApiMiddlewareFactory.create(), { allowAnonymous: false }),
						)
						it.addRoute('panel-api', `${basePath}/api/system/:projectSlug`, api.create(systemApiMiddlewareFactory.create(), { allowAnonymous: false }))

						const controller = new PanelController({
							basePath,
							apiBaseUrl: `${basePath}/api`,
							assets: panelApiMount.assets,
							pluginApis: () => panelApiMount.pluginApis,
						})
						// Optional trailing group so both `/panel` and `/panel/anything` are served. An API route
						// is a regular route and the shell an internal one, so `/panel/api/...` is matched first
						// however late a plugin registers it.
						it.addInternalRoute('panel', `${basePath}{/*path}`, controller.create())
					},
				)
	}
}

const normalizeBasePath = (path: string): string => {
	const trimmed = path.trim().replace(/\/+$/, '')
	if (!trimmed.startsWith('/') || trimmed.length < 2) {
		throw new Error(`Invalid CONTEMBER_PANEL_PATH ${JSON.stringify(path)}: expecting an absolute path like "/panel".`)
	}
	return trimmed
}
