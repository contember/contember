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
}
