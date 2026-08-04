import type { RoutingLinkTarget } from '@contember/react-routing'
import { Menu, MenuItem } from '@contember/react-ui-lib-base'
import { panelRegistry } from '../modules/index.js'
import type { PanelModule } from '../modules/types.js'

const targetOf = (module: PanelModule, projectSlug: string | undefined): RoutingLinkTarget => {
	const pageName = panelRegistry.entryPageOf(module)
	return module.scope === 'project' && projectSlug !== undefined
		? { pageName, parameters: { project: projectSlug } }
		: pageName
}

const NavItem = ({ module, projectSlug }: { module: PanelModule; projectSlug: string | undefined }) => (
	<MenuItem label={module.nav.label} icon={module.nav.icon} to={targetOf(module, projectSlug)} />
)

export interface PanelNavigationProps {
	modules: readonly PanelModule[]
	projectSlug?: string
}

/** Composed from the registry — adding a module must never mean editing the layout. */
export const PanelNavigation = ({ modules, projectSlug }: PanelNavigationProps) => {
	const ungrouped: PanelModule[] = []
	const groups = new Map<string, PanelModule[]>()

	for (const module of modules) {
		const group = module.nav.group
		if (group === undefined) {
			ungrouped.push(module)
		} else {
			const existing = groups.get(group)
			if (existing === undefined) {
				groups.set(group, [module])
			} else {
				existing.push(module)
			}
		}
	}

	return (
		<Menu>
			{ungrouped.map(module => <NavItem key={module.id} module={module} projectSlug={projectSlug} />)}
			{Array.from(groups, ([group, grouped]) => (
				<MenuItem key={group} label={group}>
					{grouped.map(module => <NavItem key={module.id} module={module} projectSlug={projectSlug} />)}
				</MenuItem>
			))}
		</Menu>
	)
}
