import { UserRoundIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const personsModule: PanelModule = {
	id: 'tenant.persons',
	scope: 'global',
	nav: {
		label: 'Persons',
		icon: <UserRoundIcon />,
		group: 'Tenant',
	},
	routes: {
		persons: { path: '/persons' },
	},
	load: async () => ({
		persons: (await import('./PersonsPage.js')).PersonsPage,
	}),
}
