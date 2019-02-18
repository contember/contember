import * as React from 'react'
import cn from 'classnames'

export enum ButtonColor {
	Blue = 'blue',
	Red = 'red',
	Green = 'green'
}

export interface ComponentProps {
	className: string
	ref?: React.Ref<any>
}

interface ButtonInnerProps<T> {
	color?: ButtonColor
	disabled?: boolean
	noBorder?: boolean
	small?: boolean
	Component?: React.ReactType<ComponentProps & T> | any // Hotfix
}

interface InnerButtonInnerProps<T> extends ButtonInnerProps<T> {
	forwardRef?: React.Ref<HTMLButtonElement>
}

export type ButtonProps<T = React.BaseHTMLAttributes<HTMLButtonElement>> = T & ButtonInnerProps<T>

class InnerButton<T = React.BaseHTMLAttributes<HTMLButtonElement>> extends React.PureComponent<
	InnerButtonInnerProps<T>
> {
	render() {
		const { Component = 'button', color, disabled, noBorder, small, children, forwardRef, ...rest } = this.props

		const attrs: ComponentProps = {
			className: cn(
				(rest as { className?: string }).className,
				'button',
				color && `button-color${color}`,
				disabled && 'button-disabled',
				noBorder && 'button-noBorder',
				small && 'button-small'
			),
			ref: forwardRef
		}
		return React.createElement(Component, { ...(rest as T), ...attrs }, children)
	}
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
	<InnerButton {...props} forwardRef={ref} />
))

export { Button }
