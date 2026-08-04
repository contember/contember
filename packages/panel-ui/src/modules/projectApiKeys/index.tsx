import { KeyRoundIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const projectApiKeysModule: PanelModule = {
	id: 'project.apiKeys',
	scope: 'project',
	nav: {
		label: 'API keys',
		icon: <KeyRoundIcon />,
	},
	routes: {
		projectApiKeys: { path: '/api-keys' },
	},
	load: async () => ({
		projectApiKeys: (await import('./ProjectApiKeysPage.js')).ProjectApiKeysPage,
	}),
}
