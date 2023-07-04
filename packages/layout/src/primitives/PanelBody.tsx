import { useComposeRef } from '@contember/react-utils'
import { PolymorphicRef, dataAttribute, useClassNameFactory } from '@contember/utilities'
import { ElementType, forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
import { useLayoutPanelContext } from './Contexts'
import { PanelBodyComponentType, PanelBodyProps } from './Types'

export const PanelBody: PanelBodyComponentType = memo(forwardRef(<C extends ElementType = 'div'>({
	as,
	children,
	className: classNameProp,
	componentClassName = 'layout-panel-body',
	style,
	...rest
}: PanelBodyProps<C>, forwardedRef: PolymorphicRef<C>) => {
	const Container = as ?? 'div'
	const { behavior, visibility } = useLayoutPanelContext()

	const elementRef = useRef<HTMLElement>(null)
	const composeRef = useComposeRef(elementRef, forwardedRef)

	const insetsStyle = useElementInsetCustomProperties(elementRef, '--inset')
	const className = useClassNameFactory(componentClassName)

	return (
		<Container
			as={typeof Container === 'string' ? undefined : 'div'}
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
PanelBody.displayName = 'Interface.LayoutPrimitives.LayoutPanelBody'
