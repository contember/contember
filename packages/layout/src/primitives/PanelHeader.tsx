import { useComposeRef } from '@contember/react-utils'
import { PolymorphicRef, dataAttribute, useClassNameFactory } from '@contember/utilities'
import { ElementType, forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
import { useLayoutPanelContext } from './Contexts'
import { PanelHeaderComponentType, PanelHeaderProps } from './Types'

export const PanelHeader: PanelHeaderComponentType = memo(forwardRef(<C extends ElementType = 'header'>({
	as,
	children,
	className: classNameProp,
	componentClassName = 'layout-panel-header',
	style,
	...rest
}: PanelHeaderProps<C>, forwardedRef: PolymorphicRef<C>) => {
	const Container = as ?? 'header'
	const { behavior, visibility } = useLayoutPanelContext()

	const elementRef = useRef<HTMLElement>(null)
	const composeRef = useComposeRef(elementRef, forwardedRef)

	const insetsStyle = useElementInsetCustomProperties(elementRef, '--inset')
	const className = useClassNameFactory(componentClassName)

	return (
		<Container
			as={typeof Container === 'string' ? undefined : 'header'}
			ref={composeRef}
			className={className(null, classNameProp)}
			data-behavior={dataAttribute(behavior)}
			data-has-insets={dataAttribute(true)}
			data-visibility={dataAttribute(visibility ?? 'hidden')}
			style={{
				...insetsStyle,
				...style,
			}}
			{...rest}
		>
			{children && <div className={className('content')}>{children}</div>}
		</Container>
	)
}))
PanelHeader.displayName = 'Interface.LayoutPrimitives.LayoutPanelHeader'
