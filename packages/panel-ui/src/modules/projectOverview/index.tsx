import { LayoutDashboardIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

/**
 * Reference project module. Its path is relative to `/panel/p/:project`, so an empty path is the
 * project root; the registry composes the prefix, nothing here repeats it.
 */
export const projectOverviewModule: PanelModule = {
	id: 'project.overview',
	scope: 'project',
	nav: {
		label: 'Overview',
		icon: <LayoutDashboardIcon />,
	},
	routes: {
		projectOverview: { path: '' },
	},
	load: async () => ({
		projectOverview: (await import('./ProjectOverviewPage.js')).ProjectOverviewPage,
	}),
}
