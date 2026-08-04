import { LockKeyholeIcon } from 'lucide-react'
import type { PanelModule } from '../types.js'

export const mySecurityModule: PanelModule = {
	id: 'me.security',
	scope: 'global',
	nav: {
		label: 'My security',
		icon: <LockKeyholeIcon />,
	},
	routes: {
		mySecurity: { path: '/me/security' },
	},
	load: async () => ({
		mySecurity: (await import('./MySecurityPage.js')).MySecurityPage,
	}),
	// Every component on the page acts on `me.person`; an identity without one has nothing to show.
	isAvailable: ({ identity }) => identity.person !== undefined,
}
