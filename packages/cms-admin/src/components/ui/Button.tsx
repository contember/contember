import * as React from 'react'
import cn from 'classnames'

export enum ButtonColor {
	Blue = 'blue',
	Red = 'red',
	Green = 'green'
}

export interface ComponentProps {
	className: string
}

interface ButtonInnerProps<T> {
	color?: ButtonColor
	disabled?: boolean
	noBorder?: boolean
	small?: boolean
	Component?: React.ReactType<ComponentProps & T> | any // Hotfix
}

export type ButtonProps<T = React.BaseHTMLAttributes<HTMLButtonElement>> = T & ButtonInnerProps<T>

class Button<T = React.BaseHTMLAttributes<HTMLButtonElement>> extends React.PureComponent<ButtonProps<T>> {
	render() {
		const { Component = 'button', color, disabled, noBorder, small, children, ...rest } = this.props

		const attrs: ComponentProps = {
			className: cn(
				(rest as { className?: string }).className,
				'button',
				color && `button-color${color}`,
				disabled && 'button-disabled',
				noBorder && 'button-noBorder',
				small && 'button-small'
			)
		}
		return React.createElement(Component, { ...(rest as T), ...attrs }, children)
	}
}

export { Button }
