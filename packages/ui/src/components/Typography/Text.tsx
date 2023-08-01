import { useClassName } from '@contember/react-utils'
import { ComponentClassNameProps } from '@contember/utilities'
import { forwardRef, memo } from 'react'
import { HTMLSpanElementProps } from '../../types'

export type TextOwnProps<Translate extends Function = Function> =
	& ComponentClassNameProps
	& (
		| {
			children: string
			fallback?: string
			translate: Translate
			values?: Record<string, any>
		}
		| {
			children: string
			fallback?: never
			translate?: never
			values?: never
		}
	)

export type TextProps<Translate extends Function = Function> =
	& Omit<HTMLSpanElementProps, keyof TextOwnProps>
	& TextOwnProps<Translate>

export const Text = memo(
	forwardRef<HTMLSpanElement, TextProps>(
		({
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
				children = fallback
					? translate(children, fallback, values)
					: translate(children, values)
			}

			return (
				<span ref={forwardedRef} {...props} className={className}>
					{children}
				</span>
			)
		},
	),
)
Text.displayName = 'Interface.Text'
