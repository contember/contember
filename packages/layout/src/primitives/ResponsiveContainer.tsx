import { useClassName, useContainerWidth } from '@contember/react-utils'
import { assert, dataAttribute, isNotNullish, numberOrFallback } from '@contember/utilities'
import { forwardRef, memo, useLayoutEffect, useMemo, useRef } from 'react'
import { GetLayoutPanelsStateContext, GetLayoutPanelsStateContextType, useGetLayoutPanelsStateContext } from './Contexts'
import { ContainerComponentType, PanelConfig } from './Types'
import { panelsStateAsDataAttributes } from './panelsStateAsDataAttributes'
import { parsePanelsState } from './parsePanelsState'

/**
 * @group Layout
 */
export const ResponsiveContainer: ContainerComponentType = memo(forwardRef(({
	as,
	children,
	className,
	componentClassName = 'layout-responsive-container',
	showDataState = true,
	...rest
}, forwardedRef) => {
	const Container = as ?? 'div'
	const layoutWidth = useContainerWidth()
	const { currentlyActivePanel, panels } = useGetLayoutPanelsStateContext()

	const previousResponsiveState = useRef<GetLayoutPanelsStateContextType>()

	const responsiveState = useMemo(() => {
		const { sumCollapsible, sumStatic, groups, maps } = parsePanelsState(currentlyActivePanel, panels)
		const previous = previousResponsiveState.current

		if (layoutWidth > 0) {
			const availableSpaceForAllCollapsiblePanels = layoutWidth - sumStatic

			let spaceLeft = availableSpaceForAllCollapsiblePanels
			let modalsCount = 0

			groups.collapsiblePanels.forEach(({ name, basis, minWidth }) => {
				const size = numberOrFallback(minWidth, basis)
				const visibility = maps.requestedVisibilities.get(name)
				const possibleBehavior = availableSpaceForAllCollapsiblePanels >= size ? 'static' : 'modal'

				maps.resultingBehaviors.set(name, possibleBehavior)

				if (spaceLeft >= size) {
					if (visibility !== 'hidden') {
						maps.resultingVisibilities.set(name, 'visible')
						spaceLeft -= size
					} else {
						maps.resultingVisibilities.set(name, 'hidden')
					}
				} else {
					if (visibility !== 'hidden' && name === currentlyActivePanel) {
						maps.resultingVisibilities.set(name, 'visible')
						modalsCount++
					} else {
						maps.resultingVisibilities.set(name, 'hidden')
					}
				}
			})

			// TODO: Check whether the overlay should not be promoted to modal
			// when the space available is less than minimum
			groups.otherPanels.forEach(panel => {
				const name = panel.name
				const behavior = maps.resultingBehaviors.get(name)
				assert('behavior is defined', behavior, isNotNullish)

				maps.resultingBehaviors.set(name, behavior)

				if (behavior === 'modal' && modalsCount > 0) {
					maps.resultingVisibilities.set(name, 'hidden')
				} else {
					maps.resultingVisibilities.set(name, maps.requestedVisibilities.get(name) ?? maps.initialVisibilities.get(name) ?? 'visible')
				}
			})
		}

		const currentlyActivePanelChanged = !previous || currentlyActivePanel !== previous.currentlyActivePanel

		let panelsChanged: boolean = false
		let nextPanels = new Map<string, PanelConfig>()

		panels.forEach(panel => {
			const name = panel.name
			const visibility = maps.resultingVisibilities.get(name)
			const behavior = maps.resultingBehaviors.get(name)
			assert('behavior is defined', behavior, isNotNullish)
			assert('visibility is not nullish', visibility, isNotNullish)

			const previousPanelState = previous?.panels.get(name)

			if (previousPanelState && behavior === previousPanelState.behavior && visibility === previousPanelState.visibility) {
				nextPanels.set(name, previousPanelState)
			} else {
				panelsChanged = true
				nextPanels.set(name, { ...panel, visibility, behavior })
			}
		})

		const allPanelsCanBeVisible = layoutWidth >= sumCollapsible + sumStatic
		const samePanelKeysAsPrevious = !previous || Array.from(nextPanels.keys()).join(',') === Array.from(previous.panels.keys()).join(',')

		if (samePanelKeysAsPrevious && !panelsChanged && previous && allPanelsCanBeVisible === previous.allPanelsCanBeVisible) {
			if (!currentlyActivePanelChanged) {
				return previous
			} else {
				return {
					allPanelsCanBeVisible,
					currentlyActivePanel,
					panels: previous.panels,
				}
			}
		} else {
			return {
				allPanelsCanBeVisible,
				currentlyActivePanel,
				panels: nextPanels,
			}
		}
	}, [layoutWidth, currentlyActivePanel, panels])

	previousResponsiveState.current = responsiveState

	const modals = useMemo(() => Array.from(responsiveState.panels.entries()).filter(
		([, { behavior }]) => behavior === 'modal',
	), [responsiveState.panels])

	const visibleModals = useMemo(() => Array.from(responsiveState.panels.entries()).filter(
		([, { behavior, visibility }]) => behavior === 'modal' && visibility === 'visible',
	), [responsiveState.panels])

	useLayoutEffect(() => {
		if (currentlyActivePanel) {
			panels.get(currentlyActivePanel)?.ref.current?.focus()
		}
	}, [panels, currentlyActivePanel])

	return (
		<GetLayoutPanelsStateContext.Provider value={responsiveState}>
			<Container
				ref={forwardedRef}
				className={useClassName(componentClassName, className)}
				data-all-panels-can-be-visible={dataAttribute(responsiveState.allPanelsCanBeVisible)}
				data-has-modals={dataAttribute(modals.length > 0)}
				data-has-visible-modal={dataAttribute(visibleModals.length > 0)}
				{...(showDataState ? panelsStateAsDataAttributes(responsiveState.panels) : undefined)}
				{...rest}
			>
				{children}
			</Container>
		</GetLayoutPanelsStateContext.Provider>
	)
}))
ResponsiveContainer.displayName = 'Interface.LayoutPrimitives.ResponsiveContainer'
