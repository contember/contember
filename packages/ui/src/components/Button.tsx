import cn from 'classnames'
import * as React from 'react'
import { Intent } from '../types'

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
	disabled?: boolean
	children?: React.ReactNode
} & (ButtonBasedProps | AnchorBasedProps | GenericProps)

export const Button = React.forwardRef<any, ButtonProps>((props, ref) => {
	const { Component, intent, children, ...rest } = props

	if (props.disabled === true) {
		rest['aria-disabled'] = true
	}

	if (props.Component === 'button' || !props.Component) {
		;(rest as React.ButtonHTMLAttributes<HTMLButtonElement>).type = 'button'
	}

	const intentClass = intent ? `view-${intent}` : undefined
	const attrs = {
		className: cn(rest.className, 'button', intentClass),
		ref: ref,
	}

	return React.createElement(Component || 'button', { ...rest, ...attrs }, children)
})
