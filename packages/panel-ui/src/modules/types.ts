import type { Identity } from '@contember/react-client-tenant'
import type { RouteMap } from '@contember/react-routing'
import type { ComponentType, ReactNode } from 'react'

/**
 * Which contexts a module needs. `global` runs against the project group (tenant API only);
 * `project` runs under a `:project` route parameter and gets the project/stage contexts.
 * Stage-scoped modules are a `project` module whose path carries a `:stage` segment.
 */
export type PanelModuleScope = 'global' | 'project'

/**
 * What {@link PanelModule.isAvailable} may decide from. This is nav tidiness, not authorization —
 * the tenant ACL is the boundary, so never use it to hide something a role could still reach.
 */
export interface PanelModuleContext {
	readonly identity: Identity
	/** The project the navigation is being composed for; `undefined` outside a project scope. */
	readonly projectSlug: string | undefined
}

/** What {@link PanelModule.load} resolves to: page name -> component. */
export type PanelModulePages = Readonly<Record<string, ComponentType>>

export interface PanelModuleNav {
	readonly label: string
	readonly icon: ReactNode
	/** Collapsible sub-menu to nest this item under. */
	readonly group?: string
	/** Page the nav item links to. Defaults to the module's first route. */
	readonly route?: string
}

export interface PanelModule {
	/** Unique, dot-separated, e.g. `tenant.persons`, `project.members`. */
	readonly id: string
	readonly scope: PanelModuleScope
	readonly nav: PanelModuleNav
	/**
	 * Page name -> route. Page names are global, so prefix them with something module-specific.
	 * Paths are relative to the scope root: `/panel` for `global`, `/panel/p/:project` for `project`.
	 */
	readonly routes: RouteMap
	/**
	 * Dynamic import of the module's pages. MUST stay a real `import()` — the built assets are
	 * embedded into the engine binary, so a module that is not its own chunk costs every deployment.
	 */
	readonly load: () => Promise<PanelModulePages>
	readonly isAvailable?: (context: PanelModuleContext) => boolean
}
