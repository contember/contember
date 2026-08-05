import { HistoryIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const historyModule: PanelModule = {
	id: 'project.history',
	scope: 'project',
	nav: {
		label: 'History',
		icon: <HistoryIcon />,
	},
	routes: {
		history: { path: '/history' },
	},
	load: async () => ({
		history: (await import('./HistoryPage.js')).HistoryPage,
	}),
	// Nav tidiness only — the system API decides. Reading the event log is `project:historyAny`, which
	// only `admin` holds. A project outside the identity's own keeps the item rather than guessing "denied".
	isAvailable: ({ identity, projectSlug }) => {
		const roles = identity.projects.find(it => it.slug === projectSlug)?.roles
		return roles === undefined || roles.includes('admin')
	},
}
