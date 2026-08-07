import { LockIcon } from 'lucide-react'
import { projectPermissionsOf } from '../../shell/permissions.js'
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
	// Listing answers empty rather than throwing, so without the flag the page would claim the
	// project has no secrets. Setting one without seeing them is still worth a page.
	isAvailable: ({ identity, projectSlug }) => {
		const permissions = projectPermissionsOf(identity, projectSlug)
		return permissions === undefined || permissions.canViewSecrets || permissions.canSetSecret
	},
}
