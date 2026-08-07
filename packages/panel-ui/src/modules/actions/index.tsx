import { ZapIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

/** The project roles the actions API grants anything to: `admin` everything, `deployer` the variables. */
const actionsRoles = ['admin', 'deployer']

export const actionsModule: PanelModule = {
	id: 'project.actions',
	scope: 'project',
	nav: {
		// The queue, not the variables: `deployer` is a CI role nobody signs in as, so the landing page
		// belongs to the admin who is actually here — and they come to look at what failed.
		label: 'Actions',
		icon: <ZapIcon />,
		route: 'actionsQueue',
	},
	routes: {
		actionsQueue: { path: '/actions' },
		actionsEvent: { path: '/actions/event/:eventId' },
		actionsVariables: { path: '/actions/variables' },
	},
	load: async () => ({
		actionsQueue: (await import('./ActionsQueuePage.js')).ActionsQueuePage,
		actionsEvent: (await import('./ActionsEventPage.js')).ActionsEventPage,
		actionsVariables: (await import('./ActionsVariablesPage.js')).ActionsVariablesPage,
	}),
	isAvailable: ({ identity, projectSlug, pluginApis }) => {
		// Without the plugin there is no API to call, so the pages would only ever render a failure.
		if (!pluginApis.includes('actions')) {
			return false
		}
		const roles = projectSlug === undefined ? undefined : identity.projects.find(it => it.slug === projectSlug)?.roles
		// Unknown roles mean show it: this is nav tidiness, and hiding what a role could still reach is the worse mistake.
		return roles === undefined || roles.some(it => actionsRoles.includes(it))
	},
}
