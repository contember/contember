import { LockIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const projectSecretsModule: PanelModule = {
	id: 'project.secrets',
	scope: 'project',
	nav: {
		label: 'Secrets',
		icon: <LockIcon />,
	},
	routes: {
		projectSecrets: { path: '/secrets' },
	},
	load: async () => ({
		projectSecrets: (await import('./ProjectSecretsPage.js')).ProjectSecretsPage,
	}),
}
