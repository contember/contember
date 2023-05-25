import { useAddClassNameDuringResize } from '@contember/react-utils'
import { PolymorphicRef, dataAttribute, isNonNegativeNumber, px, useClassName } from '@contember/utilities'
import { CSSProperties, ElementType, forwardRef, memo, useMemo } from 'react'
import { LayoutContainerWidthContext, useGetLayoutPanelsStateContext, useLayoutContainerWidth } from './Contexts'
import { LayoutPanelsStateProvider } from './LayoutPanelsStateProvider'
import { ContainerComponentType, ContainerProps, LayoutPanelConfig } from './Types'

export const LayoutRoot: ContainerComponentType = memo(forwardRef(
	<C extends ElementType = 'div'>(props: ContainerProps<C>, forwardedRef: PolymorphicRef<C>) => {
		useAddClassNameDuringResize('disable-transitions-on-resize')
		const width = useLayoutContainerWidth()

		return (
			<LayoutContainerWidthContext.Provider value={width}>
				<LayoutPanelsStateProvider>
					<LayoutRootInnerPanelsContainer {...props} ref={forwardedRef} />
				</LayoutPanelsStateProvider>
			</LayoutContainerWidthContext.Provider>
		)
	},
))
LayoutRoot.displayName = 'Layout.Root'

const LayoutRootInnerPanelsContainer = memo(forwardRef(
	<C extends ElementType = 'div'>({
		as,
		children,
		className,
		componentClassName = 'layout',
		...rest
	}: ContainerProps<C>, forwardedRef: PolymorphicRef<C>) => {
		const width = useLayoutContainerWidth()
		const Container = as ?? 'div'
		const { panels } = useGetLayoutPanelsStateContext()
		const style = useMemo(() => getPanelsCSSCustomProperties(panels, width, rest.style), [panels, rest.style, width])

		return (
			<Container
				ref={forwardedRef}
				className={useClassName(componentClassName, className)}
				{...Object.fromEntries([...panels.entries()].map(
					([name, panel]) => [
						[`data-panel-${name}-visibility`, dataAttribute(panel.visibility ? panel.visibility : undefined)],
						[`data-panel-${name}-behavior`, dataAttribute(panel.behavior ? panel.behavior : undefined)],
					],
				).flat(1))}
				{...rest}
				style={style}
			>
				{children}
			</Container>
		)
	},
))
LayoutRootInnerPanelsContainer.displayName = 'Layout.Root.InnerPanelsContainer'

function getPanelsCSSCustomProperties(panels: Map<string, LayoutPanelConfig>, width: number, restStyle: CSSProperties | undefined) {
	return {
		...([...panels.entries()].reduce(
			(previous, [panel, { basis, maxWidth, minWidth }]) => {
				return {
					...previous,
					[`--panel-${panel}-basis`]: px(isNonNegativeNumber(basis) ? Math.min(width, basis) : null),
					[`--panel-${panel}-min-width`]: px(isNonNegativeNumber(minWidth) ? Math.min(width, minWidth) : null),
					[`--panel-${panel}-max-width`]: px(isNonNegativeNumber(maxWidth) ? Math.min(width, maxWidth) : null),
				}
			},
			{} as CSSProperties,
		)),
		...restStyle,
	} as CSSProperties
}
