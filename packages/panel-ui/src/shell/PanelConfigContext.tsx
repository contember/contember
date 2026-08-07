import { createContext, type ReactNode, useContext } from 'react'
import type { PanelRuntimeConfig } from '../config.js'

const PanelConfigContext = createContext<PanelRuntimeConfig | undefined>(undefined)

export const PanelConfigProvider = ({ config, children }: { config: PanelRuntimeConfig; children: ReactNode }) => (
	<PanelConfigContext.Provider value={config}>{children}</PanelConfigContext.Provider>
)

export const usePanelConfig = (): PanelRuntimeConfig => {
	const config = useContext(PanelConfigContext)
	if (config === undefined) {
		throw new Error('usePanelConfig must be used inside the panel application.')
	}
	return config
}
