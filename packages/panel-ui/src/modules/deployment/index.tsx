import { RocketIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const deploymentModule: PanelModule = {
	id: 'project.deployment',
	scope: 'project',
	nav: {
		label: 'Deployment',
		icon: <RocketIcon />,
	},
	routes: {
		deployment: { path: '/deployment' },
	},
	load: async () => ({
		deployment: (await import('./DeploymentPage.js')).DeploymentPage,
	}),
	// Nav tidiness only — the system API decides. `admin` gets everything; `deployer` may list migrations.
	// A project outside the identity's own keeps the item: guessing "denied" would hide a page they can reach.
	isAvailable: ({ identity, projectSlug }) => {
		const roles = identity.projects.find(it => it.slug === projectSlug)?.roles
		return roles === undefined || roles.includes('admin') || roles.includes('deployer')
	},
}
