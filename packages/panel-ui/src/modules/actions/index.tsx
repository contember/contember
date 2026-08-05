import { ZapIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

/** The project roles the actions API grants anything to: `admin` everything, `deployer` the variables. */
const actionsRoles = ['admin', 'deployer']

export const actionsModule: PanelModule = {
	id: 'project.actions',
	scope: 'project',
	nav: {
		label: 'Actions',
		icon: <ZapIcon />,
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
