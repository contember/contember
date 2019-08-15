import cn from 'classnames'
import * as React from 'react'
import { Intent } from '../types'

export type ButtonProps = {
	intent?: Intent
	readOnly?: boolean
	children?: React.ReactNode
} & (
	| {
			[E in keyof JSX.IntrinsicElements]: {
				Component: E
			} & Omit<JSX.IntrinsicElements[E], 'ref' | 'key'>
	  }[keyof JSX.IntrinsicElements]
	| ({
			Component?: undefined
	  } & React.ButtonHTMLAttributes<HTMLButtonElement>))

export const Button = React.forwardRef<any, ButtonProps>((props, ref) => {
	const { Component = 'button', intent, children, ...rest } = props

	if (props.Component === 'button') {
		props.type = 'button'

		if (props.readOnly) {
			props.disabled = props['aria-disabled'] = true
		}
	}

	const intentClass = intent ? `view-${intent}` : undefined
	const attrs = {
		className: cn(rest.className, 'button', intentClass),
		ref: ref,
	}

	return React.createElement(Component, { ...rest, ...attrs }, children)
})
