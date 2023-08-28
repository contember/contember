import { useClassNameFactory, useComposeRef } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
import { useLayoutPanelContext } from './Contexts'
import { PanelBodyComponentType } from './Types'

/**
 * @group Layout
 */
export const PanelBody: PanelBodyComponentType = memo(forwardRef(({
	as: Container = 'div',
	children,
	className: classNameProp,
	componentClassName = 'layout-panel-body',
	style,
	...rest
}, forwardedRef) => {
	const { behavior, visibility } = useLayoutPanelContext()

	const elementRef = useRef<HTMLDivElement>(null)
	const composeRef = useComposeRef(elementRef, forwardedRef)

	const insetsStyle = useElementInsetCustomProperties(elementRef, '--inset')
	const className = useClassNameFactory(componentClassName)

	return (
		<Container
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
