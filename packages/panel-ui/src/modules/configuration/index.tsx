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
	isAvailable: ({ identity }) =>
		identity.permissions.canViewConfiguration
		|| identity.permissions.canManageConfiguration
		|| identity.permissions.canListIdentityProviders
		|| identity.permissions.canListMailTemplates,
}
