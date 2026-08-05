import { KeyRoundIcon } from 'lucide-react'
import { mayPerform, projectPermissionsOf } from '../../shell/permissions.js'
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
	// `Project.apiKeys` is gated by the same permission the member list is.
	isAvailable: ({ identity, projectSlug }) => mayPerform(projectPermissionsOf(identity, projectSlug)?.canViewMembers),
}
