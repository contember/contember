import type { RouteMap } from '@contember/react-routing'
import type { PanelModule, PanelModuleContext } from './types.js'

/** Fixed position of the project slug for every project-scoped module — see PANEL-PLAN §3.1. */
export const projectRoutePrefix = '/p/:project'

/** Routes the shell owns; module page names may not collide with them. */
export const indexPageName = 'index'
export const resetRequestPageName = 'resetRequest'

export const shellRoutes: RouteMap = {
	[indexPageName]: { path: '/' },
	[resetRequestPageName]: { path: '/reset-request' },
}

export interface PanelPage {
	readonly module: PanelModule
	readonly pageName: string
}

export interface PanelRegistry {
	readonly modules: readonly PanelModule[]
	/** Every route the panel answers, shell routes included, ready for `RoutingProvider`. */
	readonly routes: RouteMap
	/** Page name -> the module that renders it. */
	readonly pages: ReadonlyMap<string, PanelPage>
	/** Page the module's nav item links to. */
	readonly entryPageOf: (module: PanelModule) => string
	readonly availableModules: (context: PanelModuleContext) => readonly PanelModule[]
}

const entryPageOf = (module: PanelModule): string => {
	const pageName = module.nav.route ?? Object.keys(module.routes)[0]
	if (pageName === undefined) {
		throw new Error(`Panel module "${module.id}" declares no routes.`)
	}
	if (!(pageName in module.routes)) {
		throw new Error(`Panel module "${module.id}" points its nav at "${pageName}", which is not one of its routes.`)
	}
	return pageName
}

export const createPanelRegistry = (modules: readonly PanelModule[]): PanelRegistry => {
	const routes: RouteMap = { ...shellRoutes }
	const pages = new Map<string, PanelPage>()

	for (const module of modules) {
		entryPageOf(module) // fail at startup rather than on the first click
		for (const [pageName, route] of Object.entries(module.routes)) {
			if (pageName in routes) {
				throw new Error(`Panel page name "${pageName}" is claimed by more than one module; "${module.id}" is the second.`)
			}
			const prefix = module.scope === 'project' ? projectRoutePrefix : ''
			routes[pageName] = { ...route, path: `${prefix}${route.path}` }
			pages.set(pageName, { module, pageName })
		}
	}

	return {
		modules,
		routes,
		pages,
		entryPageOf,
		availableModules: context => modules.filter(it => it.isAvailable?.(context) ?? true),
	}
}
