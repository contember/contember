import cn from 'classnames'
import * as React from 'react'
import { ButtonDistinction, Intent, Size } from '../types'
import { toStateClass, toViewClass } from '../utils'
import { Spinner } from './Spinner'

// TODO these types are wonky
interface ButtonBasedProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	Component?: 'button' | undefined
}

interface AnchorBasedProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
	Component: 'a'
}

interface GenericProps extends React.HTMLAttributes<HTMLElement> {
	Component: Exclude<keyof JSX.IntrinsicElements, 'button' | 'a'>
}

export type ButtonProps = {
	intent?: Intent
	size?: Size
	distinction?: ButtonDistinction
	isLoading?: boolean
	disabled?: boolean
	children?: React.ReactNode
} & (ButtonBasedProps | AnchorBasedProps | GenericProps)

export const Button = React.forwardRef<any, ButtonProps>((props, ref) => {
	const { Component, intent, size, distinction, isLoading, children, ...rest } = props

	if (props.disabled === true) {
		rest['aria-disabled'] = true
	}

	if (props.Component === 'button' || !props.Component) {
		;(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type = 'button'
	}

	const attrs = {
		className: cn(
			rest.className,
			'button',
			toViewClass(intent),
			toViewClass(size),
			toViewClass(distinction),
			toStateClass('loading', isLoading),
		),
		ref: ref,
	}
	const content = (
		<>
			<div className="button-content">{children}</div>
			{isLoading && (
				<span className="button-spinner">
					<Spinner />
				</span>
			)}
		</>
	)

	return React.createElement(Component || 'button', { ...rest, ...attrs }, content)
})
