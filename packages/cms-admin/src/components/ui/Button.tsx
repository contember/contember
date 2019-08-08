import * as React from 'react'
import cn from 'classnames'
import { Intent } from './Intent'

export interface ComponentProps {
	className: string
	disabled?: boolean
	ref?: React.Ref<any>
}

interface ButtonInnerProps<T> {
	intent?: Intent
	disabled?: boolean
	noBorder?: boolean
	small?: boolean
	large?: boolean
	minimal?: boolean
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
		const {
			Component = 'button',
			intent,
			disabled,
			noBorder,
			small,
			large,
			minimal,
			children,
			forwardRef,
			...rest
		} = this.props

		const attrs: ComponentProps = {
			className: cn(
				(rest as { className?: string }).className,
				'button',
				intent && `view-${intent}`,
				noBorder && 'button-noBorder',
				small && 'button-small',
				large && 'button-large',
				minimal && 'button-minimal',
			),
			ref: forwardRef,
			disabled: disabled === true,
		}

		return React.createElement(Component, { ...(rest as T), ...attrs }, children)
	}
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => (
	<InnerButton {...props} forwardRef={ref} />
))

export { Button }
