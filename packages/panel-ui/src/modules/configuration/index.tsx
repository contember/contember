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
	// The four views gate on four different actions and only two of them have an introspection flag.
	// Offering the module on either means a caller who can read something is never sent away; one who
	// holds only `idp:list` or `mailTemplate:list` still misses out until those get flags of their own.
	isAvailable: ({ identity }) => identity.permissions.canViewConfiguration || identity.permissions.canManageConfiguration,
}
