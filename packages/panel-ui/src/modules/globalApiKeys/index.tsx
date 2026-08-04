import { KeyRoundIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const globalApiKeysModule: PanelModule = {
	id: 'tenant.apiKeys',
	scope: 'global',
	nav: {
		label: 'Global API keys',
		icon: <KeyRoundIcon />,
		group: 'Tenant',
	},
	routes: {
		globalApiKeys: { path: '/api-keys' },
	},
	load: async () => ({
		globalApiKeys: (await import('./GlobalApiKeysPage.js')).GlobalApiKeysPage,
	}),
	// The listing answers an empty page rather than throwing, so without the flag "none" and
	// "not yours to see" would look identical. Issuing keys without listing them is still useful.
	isAvailable: ({ identity }) => identity.permissions.canListGlobalApiKeys || identity.permissions.canCreateGlobalApiKey,
}
