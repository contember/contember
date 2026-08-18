import { UsersIcon } from 'lucide-react'
import { mayPerform, projectPermissionsOf } from '../../shell/permissions.js'
import type { PanelModule } from '../types.js'

export const membersModule: PanelModule = {
	id: 'project.members',
	scope: 'project',
	nav: {
		label: 'Members',
		icon: <UsersIcon />,
	},
	routes: {
		projectMembers: { path: '/members' },
	},
	load: async () => ({
		projectMembers: (await import('./MembersPage.js')).MembersPage,
	}),
	isAvailable: ({ identity, projectSlug }) => mayPerform(projectPermissionsOf(identity, projectSlug)?.canViewMembers),
}
