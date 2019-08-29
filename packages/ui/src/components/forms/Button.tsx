import cn from 'classnames'
import * as React from 'react'
import { ButtonDistinction, ButtonFlow, Intent, Size } from '../../types'
import { toStateClass, toEnumViewClass } from '../../utils'
import { Spinner } from '../Spinner'

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

export interface ButtonOwnProps {
	intent?: Intent
	size?: Size
	flow?: ButtonFlow
	distinction?: ButtonDistinction
	isLoading?: boolean
	isActive?: boolean
	disabled?: boolean
	children?: React.ReactNode
}

export type ButtonProps = ButtonOwnProps & (ButtonBasedProps | AnchorBasedProps | GenericProps)

export const Button = React.memo(
	React.forwardRef<any, ButtonProps>((props, ref) => {
		const { Component, intent, size, flow, distinction, isLoading, isActive, children, ...rest } = props

		if (props.disabled === true) {
			rest['aria-disabled'] = true
		}

		if (props.Component === 'button' || !props.Component) {
			;(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type = props.type !== undefined ? props.type : 'button'
		}

		const attrs = {
			className: cn(
				rest.className,
				'button',
				toEnumViewClass(intent),
				toEnumViewClass(size),
				toEnumViewClass(distinction),
				toEnumViewClass(flow),
				toStateClass('loading', isLoading),
				toStateClass('active', isActive),
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
	}),
)
Button.displayName = 'Button'
