import type { RoutingLinkTarget } from '@contember/react-routing'
import { useCallback } from 'react'
import { panelRegistry } from '../modules/index.js'
import { indexPageName } from '../modules/registry.js'
import { useAvailableModulesResolver } from './modules.js'

/**
 * Where "open this project" goes: the first project module the identity may use. Keeps callers from
 * having to name a module, so the entry point follows whatever is registered.
 */
export const useProjectEntryTarget = (): (projectSlug: string) => RoutingLinkTarget => {
	const availableModules = useAvailableModulesResolver()

	return useCallback((projectSlug: string): RoutingLinkTarget => {
		const module = availableModules(projectSlug).find(it => it.scope === 'project')
		return module === undefined
			? { pageName: indexPageName }
			: { pageName: panelRegistry.entryPageOf(module), parameters: { project: projectSlug } }
	}, [availableModules])
}
