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

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	color?: ButtonColor
	disabled?: boolean
	noBorder?: boolean
	small?: boolean
	Component?: React.ReactType<ComponentProps>
}

const Button: React.FunctionComponent<ButtonProps> = props => {
	const { Component = 'button', color, disabled, noBorder, small, children, ...rest } = props

	return React.createElement(
		Component,
		{
			...rest,
			className: cn(
				rest.className,
				'button',
				color && `button-color${color}`,
				disabled && 'button-disabled',
				noBorder && 'button-noBorder',
				small && 'button-small'
			)
		},
		children
	)
}

Button.displayName = 'Button'

export { Button }
