import { actionsModule } from './actions/index.js'
import { authLogModule } from './authLog/index.js'
import { configurationModule } from './configuration/index.js'
import { deploymentModule } from './deployment/index.js'
import { globalApiKeysModule } from './globalApiKeys/index.js'
import { historyModule } from './history/index.js'
import { membersModule } from './members/index.js'
import { mySecurityModule } from './mySecurity/index.js'
import { personsModule } from './persons/index.js'
import { projectApiKeysModule } from './projectApiKeys/index.js'
import { projectOverviewModule } from './projectOverview/index.js'
import { projectSecretsModule } from './projectSecrets/index.js'
import { projectsModule } from './projects/index.js'
import { createPanelRegistry } from './registry.js'
import type { PanelModule } from './types.js'

/**
 * Every module the panel knows about. Adding one is a new directory plus a line here — the layout,
 * the navigation and the router are all composed from this list.
 *
 * Order matters twice: `/panel/` lands on the first global module, and "open this project" goes to
 * the first project module.
 */
export const panelModules: readonly PanelModule[] = [
	projectsModule,
	mySecurityModule,
	personsModule,
	globalApiKeysModule,
	authLogModule,
	configurationModule,
	projectOverviewModule,
	membersModule,
	projectApiKeysModule,
	projectSecretsModule,
	deploymentModule,
	historyModule,
	actionsModule,
]

/** Built once at startup so a bad registration fails loudly rather than on the first click. */
export const panelRegistry = createPanelRegistry(panelModules)
