import cn from 'classnames'
import { ButtonHTMLAttributes, createElement, forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../auxiliary'
import type { ButtonDistinction, ButtonFlow, Intent, Justification, Size } from '../../types'
import { toEnumViewClass, toStateClass, toViewClass } from '../../utils'
import { Spinner } from '../Spinner'

type PropBlackList = 'ref' | 'size'

export interface ButtonBasedProps extends Omit<JSX.IntrinsicElements['button'], PropBlackList> {
	Component: 'button'
}

export interface AnchorBasedProps extends Omit<JSX.IntrinsicElements['a'], PropBlackList> {
	Component: 'a'
}

export interface ButtonOwnProps {
	intent?: Intent
	size?: Size
	flow?: ButtonFlow
	distinction?: ButtonDistinction
	justification?: Justification
	isLoading?: boolean
	isActive?: boolean
	disabled?: boolean
	bland?: boolean
	children?: ReactNode
}

export type ButtonProps = ButtonOwnProps & Omit<ButtonBasedProps, 'Component'>
export type AnchorButtonProps = ButtonOwnProps & Omit<AnchorBasedProps, 'Component'>

type BaseButtonProps = ButtonOwnProps & (ButtonBasedProps | AnchorBasedProps)

export const AnchorButton = memo(
	forwardRef<HTMLAnchorElement, AnchorButtonProps>((props, ref) => {
		return <BaseButton {...props} ref={ref} Component={'a'}/>
	}),
)
AnchorButton.displayName = 'AnchorButton'

export const Button = memo(
	forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
		return <BaseButton {...props} ref={ref} Component={'button'}/>
	}),
)
Button.displayName = 'Button'

export const BaseButton = memo(
	forwardRef<any, BaseButtonProps>((props, ref) => {
		const { Component, intent, size, flow, distinction, justification, isLoading, isActive, bland, children, ...rest } =
			props

		if (props.disabled === true) {
			rest['aria-disabled'] = true
		}

		if (props.Component === 'button') {
			(rest as ButtonHTMLAttributes<HTMLButtonElement>).type = props.type !== undefined ? props.type : 'button'
		}
		const prefix = useClassNamePrefix()

		const attrs = {
			className: cn(
				rest.className,
				`${prefix}button`,
				toEnumViewClass(intent),
				toEnumViewClass(size),
				toEnumViewClass(distinction),
				toEnumViewClass(flow),
				toEnumViewClass(justification, 'justifyCenter'),
				toStateClass('loading', isLoading),
				toStateClass('active', isActive),
				toViewClass('bland', bland),
			),
			ref: ref,
		}
		const content = (
			<>
				<div className={`${prefix}button-content`}>{children}</div>
				{isLoading && (
					<span className={`${prefix}button-spinner`}>
						<Spinner />
					</span>
				)}
			</>
		)

		return createElement(Component, { ...rest, ...attrs }, content)
	}),
)
BaseButton.displayName = 'BaseButton'

