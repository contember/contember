import cn from 'classnames'
import * as React from 'react'
import { ButtonDistinction, Intent, Size } from '../types'
import { toViewClass } from '../utils'

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
	disabled?: boolean
	children?: React.ReactNode
} & (ButtonBasedProps | AnchorBasedProps | GenericProps)

export const Button = React.forwardRef<any, ButtonProps>((props, ref) => {
	const { Component, intent, size, distinction, children, ...rest } = props

	if (props.disabled === true) {
		rest['aria-disabled'] = true
	}

	if (props.Component === 'button' || !props.Component) {
		;(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type = 'button'
	}

	const attrs = {
		className: cn(rest.className, 'button', toViewClass(intent), toViewClass(size), toViewClass(distinction)),
		ref: ref,
	}

	return React.createElement(Component || 'button', { ...rest, ...attrs }, children)
})
