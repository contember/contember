import cn from 'classnames'
import { ButtonHTMLAttributes, createElement, forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import type { ButtonDistinction, ButtonFlow, Intent, Justification, Scheme, Size } from '../../../types'
import { toEnumViewClass, toSchemeClass, toStateClass, toThemeClass, toViewClass } from '../../../utils'
import { Spinner } from '../../Spinner'

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
	loading?: boolean
	active?: boolean
	disabled?: boolean
	bland?: boolean
	children?: ReactNode
	scheme?: Scheme
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
		const { Component, intent, size, flow, distinction, justification, loading, active, bland, children, scheme, ...rest } =
			props

		if (props.disabled === true) {
			rest['aria-disabled'] = true,
			rest['tabIndex'] = -1
		}

		if (props.Component === 'button') {
			(rest as ButtonHTMLAttributes<HTMLButtonElement>).type = props.type !== undefined ? props.type : 'button'
		}
		const prefix = useClassNamePrefix()
		const themeIntent = !props.disabled ? intent : 'default'

		const attrs = {
			className: cn(
				rest.className,
				`${prefix}button`,
				toThemeClass(props.distinction === 'default' ? null : themeIntent, themeIntent),
				toSchemeClass(!props.disabled ? scheme : undefined),
				toEnumViewClass(size),
				toEnumViewClass(props.disabled ? 'default' : distinction),
				toEnumViewClass(flow),
				toEnumViewClass(justification, 'justifyCenter'),
				toStateClass('loading', loading),
				toStateClass('active', active),
				toViewClass('bland', bland),
			),
			ref: ref,
			...(props.disabled ? {
				href: null,
			} : undefined),
		}
		const content = (
			<>
				<div className={`${prefix}button-content`}>{children}</div>
				{loading && (
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
