import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps, PolymorphicComponent } from '@contember/utilities'
import { ReactNode, forwardRef, memo } from 'react'

export interface TextOwnProps<Translate extends Function = Function> extends ComponentClassNameProps {
	children?: ReactNode
	fallback?: string
	translate?: Translate
	values?: Record<string, any>
}

export type TextProps<Translate extends Function = Function> =
	& TextOwnProps<Translate>

export const Text: PolymorphicComponent<'span', TextProps> = memo(forwardRef(({
	as: Container = 'span',
	children,
	className: classNameProp,
	componentClassName = ['view', 'text'],
	fallback,
	values,
	translate,
	...props
}, forwardedRef) => {
	const className = useClassName(componentClassName, classNameProp)

	if (translate) {
		if (typeof children === 'string') {
			children = fallback
				? translate(children, fallback, values)
				: translate(children, values)
		} else if (import.meta.env.DEV) {
			console.warn('Text component can only translate string children')
		}
	}

	return (
		<Container
			ref={forwardedRef}
			{...props}
			className={className}
		>
			{children}
		</Container>
	)
}))
Text.displayName = 'Interface.Text'
