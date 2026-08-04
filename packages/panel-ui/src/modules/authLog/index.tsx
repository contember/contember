import { ScrollTextIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const authLogModule: PanelModule = {
	id: 'tenant.authLog',
	scope: 'global',
	nav: {
		label: 'Auth log',
		icon: <ScrollTextIcon />,
		group: 'Tenant',
	},
	routes: {
		authLog: { path: '/auth-log' },
	},
	load: async () => ({
		authLog: (await import('./AuthLogPage.js')).AuthLogPage,
	}),
	// The query throws without this, so the page has nothing to show but a notice.
	isAvailable: ({ identity }) => identity.permissions.canViewAuthLog,
}
