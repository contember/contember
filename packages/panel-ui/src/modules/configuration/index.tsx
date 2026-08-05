import { SettingsIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const configurationModule: PanelModule = {
	id: 'tenant.configuration',
	scope: 'global',
	nav: {
		label: 'Configuration',
		icon: <SettingsIcon />,
		group: 'Tenant',
	},
	routes: {
		configuration: { path: '/configuration' },
	},
	load: async () => ({
		configuration: (await import('./ConfigurationPage.js')).ConfigurationPage,
	}),
	// All four views throw without it; every one of them would render the same notice.
	isAvailable: ({ identity }) => identity.permissions.canViewConfiguration,
}
