import { assert } from '@contember/utilities'
import deepEqual from 'fast-deep-equal/es6/index.js'
import { ReactNode, memo, useCallback, useMemo, useState } from 'react'
import { GetLayoutPanelsStateContext, SetLayoutPanelsStateContext, SetLayoutPanelsStateContextType } from './Contexts'
import { PanelConfig } from './Types'

/**
 * @group Layout
 */
export const PanelsStateProvider = memo<{ children: ReactNode }>(({ children }) => {
	const [currentlyActivePanel, setCurrentlyActivePanel] = useState<string>()
	const [panels, setPanels] = useState<Map<string, PanelConfig>>(new Map)

	const updatePanels = useCallback((
		panel: string,
		updater: (previous: PanelConfig) => PanelConfig,
	) => {
		setPanels(panels => {
			if (panels.has(panel)) {
				const previous = panels.get(panel)
				if (previous === undefined) {
					throw new Error(`Previous value is undefined`)
				}

				const next = updater(previous)

				if (!deepEqual(next, previous)) {
					return new Map([...panels, [panel, next]])
				} else {
					return panels
				}
			} else {
				console.warn(`Record with ${panel} key does not exist`, { panels, updater })
				return panels
			}
		})
	}, [])

	const layoutPanelRegister: SetLayoutPanelsStateContextType = useMemo(() => {
		return {
			registerLayoutPanel: (name: string, config: PanelConfig) => {
				setPanels(panels => {
					const previous = panels.get(name)

					if (!previous || !deepEqual(config, previous)) {
						return new Map([...panels, [name, config]])
					} else {
						return panels
					}
				})
			},
			unregisterLayoutPanel: (name: string) => {
				setPanels(panels => {
					panels.delete(name)
					return new Map([...panels])
				})
			},
			show: (panel: string) => {
				setCurrentlyActivePanel(panel)
				updatePanels(panel, previous => ({ ...previous, visibility: 'visible' }))
			},
			hide: (panel: string) => {
				setCurrentlyActivePanel(deactivateIfPanelMatches(panel))
				updatePanels(panel, previous => ({ ...previous, visibility: 'hidden' }))
			},
			reset: (panel: string) => {
				updatePanels(panel, previous => ({ ...previous, visibility: null }))
			},
			activate: (panel: string) => {
				setCurrentlyActivePanel(panel)
			},
			deactivate: (panel: string) => {
				setCurrentlyActivePanel(deactivateIfPanelMatches(panel))
			},
			update: (panel, config) => {
				if (config) {
					assert('config has no property "name"', config, (value: typeof config): value is Partial<Omit<PanelConfig, 'name'>> => {
						return !('name' in config)
					})

					const passive = config.passive ?? true

					updatePanels(panel, previous => {
						if (!passive && config.visibility && previous.visibility !== config.visibility) {
							if (config.visibility === 'visible') {
								setCurrentlyActivePanel(panel)
							} else if (previous.visibility === 'visible') {
								setCurrentlyActivePanel(deactivateIfPanelMatches(panel))
							}
						}

						return ({ ...previous, ...config })
					})
				}
			},
		}
	}, [updatePanels])

	const state = useMemo(() => ({
		currentlyActivePanel,
		panels,
	}), [panels, currentlyActivePanel])

	return (
		<SetLayoutPanelsStateContext.Provider value={layoutPanelRegister}>
			<GetLayoutPanelsStateContext.Provider value={state}>
				{children}
			</GetLayoutPanelsStateContext.Provider>
		</SetLayoutPanelsStateContext.Provider>
	)
})
PanelsStateProvider.displayName = 'Interface.LayoutPrimitives.LayoutPanelsStateProvider'

function deactivateIfPanelMatches(panel: string) {
	return function maybeDeactivatePanel(current: string | undefined) {
		return current === panel ? undefined : current
	}
}
