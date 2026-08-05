import { useIdentity } from '@contember/react-client-tenant'
import { useCallback, useMemo } from 'react'
import { panelRegistry } from '../modules/index.js'
import type { PanelModule } from '../modules/types.js'
import { usePanelConfig } from './PanelConfigContext.js'

/**
 * Resolves the usable modules for any project scope. The single place the module context is
 * assembled, so a new input to `isAvailable` reaches every caller at once.
 */
export const useAvailableModulesResolver = (): (projectSlug: string | undefined) => readonly PanelModule[] => {
	const identity = useIdentity()
	const { pluginApis } = usePanelConfig()

	return useCallback(
		projectSlug => identity === undefined ? [] : panelRegistry.availableModules({ identity, projectSlug, pluginApis }),
		[identity, pluginApis],
	)
}

/** Modules this account can use in the given scope. */
export const useAvailableModules = (projectSlug: string | undefined): readonly PanelModule[] => {
	const resolve = useAvailableModulesResolver()
	return useMemo(() => resolve(projectSlug), [resolve, projectSlug])
}
