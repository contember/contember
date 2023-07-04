import { ContainerWidthContext, useAddClassNameDuringResize, useContainerWidth } from '@contember/react-utils'
import { PolymorphicRef, isNonNegativeNumber, px, useClassName } from '@contember/utilities'
import { CSSProperties, ElementType, forwardRef, memo, useMemo } from 'react'
import { useGetLayoutPanelsStateContext } from './Contexts'
import { PanelsStateProvider } from './PanelsStateProvider'
import { ContainerComponentType, ContainerProps, PanelConfig } from './Types'
import { panelsStateAsDataAttributes } from './panelsStateAsDataAttributes'

export const Root: ContainerComponentType = memo(forwardRef(
	<C extends ElementType = 'div'>(props: ContainerProps<C>, forwardedRef: PolymorphicRef<C>) => {
		useAddClassNameDuringResize('disable-transitions-on-resize')
		const width = useContainerWidth()

		return (
			<ContainerWidthContext.Provider value={width}>
				<PanelsStateProvider>
					<LayoutRootInnerPanelsContainer {...props} ref={forwardedRef} />
				</PanelsStateProvider>
			</ContainerWidthContext.Provider>
		)
	},
))
Root.displayName = 'Interface.LayoutPrimitives.LayoutRoot'

const LayoutRootInnerPanelsContainer = memo(forwardRef(<C extends ElementType = 'div'>({
	as,
	children,
	className,
	componentClassName = 'layout',
	showDataState = true,
	...rest
}: ContainerProps<C>, forwardedRef: PolymorphicRef<C>) => {
	const width = useContainerWidth()
	const Container = as ?? 'div'
	const { panels } = useGetLayoutPanelsStateContext()
	const style = useMemo(() => getPanelsCSSCustomProperties(panels, width, rest.style), [panels, rest.style, width])

	return (
		<Container
			ref={forwardedRef}
			className={useClassName(componentClassName, className)}
			{...(showDataState ? panelsStateAsDataAttributes(panels) : undefined)}
			{...rest}
			style={style}
		>
			{children}
		</Container>
	)
}))
LayoutRootInnerPanelsContainer.displayName = 'Interface.LayoutPrimitives.LayoutRootInnerPanelsContainer'

function getPanelsCSSCustomProperties(panels: Map<string, PanelConfig>, width: number, restStyle: CSSProperties | undefined) {
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
