import { FoldersIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

/**
 * Reference global module. Registration is this whole file: an id, a scope, a nav entry, routes
 * relative to the scope root, and a `load()` that dynamically imports the pages.
 */
export const projectsModule: PanelModule = {
	id: 'tenant.projects',
	scope: 'global',
	nav: {
		label: 'Projects',
		icon: <FoldersIcon />,
	},
	routes: {
		projects: { path: '/projects' },
	},
	load: async () => ({
		projects: (await import('./ProjectsPage.js')).ProjectsPage,
	}),
}
