import type { MasterContainerBuilder, MasterContainerHook, Plugin } from '@contember/engine-http'
import { panelAssets } from './generated/assets.js'
import { ConfiguredPanelAccessCheck } from './PanelAccessCheck.js'
import { PanelApiControllerFactory } from './PanelApiController.js'
import { PanelAssetStore } from './PanelAssets.js'
import { PanelController } from './PanelController.js'

const defaultBasePath = '/panel'

export class PanelPlugin implements Plugin {
	name = 'contember/panel'

	getMasterContainerHook(): MasterContainerHook {
		return (builder: MasterContainerBuilder) =>
			builder.setupService(
				'application',
				(it, { serverConfig, logger, tenantApiMiddlewareFactory, contentApiMiddlewareFactory, systemApiMiddlewareFactory }) => {
					if (serverConfig.panel?.enabled !== true) {
						return
					}
					const basePath = normalizeBasePath(serverConfig.panel.path ?? defaultBasePath)
					const assets = new PanelAssetStore(panelAssets)
					if (assets.isEmpty()) {
						// Running from source without the build step. A released build cannot get here —
						// `scripts/buildAssets.ts` fails when the panel produced nothing — so this is a
						// developer's checkout, and refusing to start would be a poor trade.
						logger.error(
							new Error(
								'The panel is enabled but this build contains no panel assets — run `bun run --filter=@contember/engine-panel pre-build`. Not serving the panel.',
							),
						)
						return
					}

					// The panel's own API mount. Registered before the asset route so `/panel/api/...` is
					// never swallowed by the SPA fallback, and mirroring the public paths so the client's
					// existing URL building (`${apiBaseUrl}${path}`) needs no special cases.
					// Only tenant takes anonymous callers — it is the one the sign-in screen talks to
					// before there is a session. Content and system have no pre-sign-in consumer.
					const api = new PanelApiControllerFactory(new ConfiguredPanelAccessCheck())
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
						assets,
					})
					// Optional trailing group so both `/panel` and `/panel/anything` are served.
					it.addInternalRoute('panel', `${basePath}{/*path}`, controller.create())
				},
			) as unknown as MasterContainerBuilder
	}
}

const normalizeBasePath = (path: string): string => {
	const trimmed = path.trim().replace(/\/+$/, '')
	if (!trimmed.startsWith('/') || trimmed.length < 2) {
		throw new Error(`Invalid CONTEMBER_PANEL_PATH ${JSON.stringify(path)}: expecting an absolute path like "/panel".`)
	}
	return trimmed
}
