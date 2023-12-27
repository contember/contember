import { useClassNameFactory, useComposeRef } from '@contember/react-utils'
import { dataAttribute } from '@contember/utilities'
import { forwardRef, memo, useRef } from 'react'
import { useElementInsetCustomProperties } from '../insets'
import { useLayoutPanelContext } from './Contexts'
import { PanelFooterComponentType } from './Types'

/**
 * @group Layout
 */
export const PanelFooter: PanelFooterComponentType = memo(forwardRef(({
	as: Container = 'footer',
	children,
	className: classNameProp,
	componentClassName = 'layout-panel-footer',
	style,
	...rest
}, forwardedRef) => {
	const { behavior, visibility } = useLayoutPanelContext()

	const elementRef = useRef<HTMLDivElement>(null)
	const composeRef = useComposeRef(elementRef, forwardedRef)

	const insetsStyle = useElementInsetCustomProperties(elementRef, 'inset')
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
PanelFooter.displayName = 'Interface.LayoutPrimitives.LayoutPanelFooter'
