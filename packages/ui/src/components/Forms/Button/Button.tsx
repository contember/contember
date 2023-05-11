import cn from 'classnames'
import { createElement, forwardRef, memo, ReactNode } from 'react'
import { useClassNamePrefix } from '../../../auxiliary'
import type {
	HTMLAnchorElementProps,
	HTMLButtonElementProps,
	Intent,
	Justification,
	Scheme,
	Size,
} from '../../../types'
import { toEnumClass, toEnumViewClass, toSchemeClass, toStateClass, toThemeClass, toViewClass } from '../../../utils'
import { Spinner } from '../../Spinner'
import type { ButtonDistinction, ButtonElevation, ButtonFlow } from './Types'

export interface ButtonBasedProps extends Omit<HTMLButtonElementProps, 'ref' | 'size'> {
	Component: 'button'
}

export interface AnchorBasedProps extends Omit<HTMLAnchorElementProps, 'ref' | 'size'> {
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
	elevation?: ButtonElevation
}

export type ButtonProps = ButtonOwnProps & Omit<ButtonBasedProps, 'Component'>
export type AnchorButtonProps = ButtonOwnProps & Omit<AnchorBasedProps, 'Component'>

export type BaseButtonProps = ButtonOwnProps & (ButtonBasedProps | AnchorBasedProps)

/**
 * @example
 * ```
 * <AnchorButton href="#id">Go to id</AnchorButton>
 * ```
 *
 * @group UI
 */
export const AnchorButton = memo(forwardRef<HTMLAnchorElement, AnchorButtonProps>((props, ref) => {
	return <BaseButton {...props} ref={ref} Component={'a'} />
}))
AnchorButton.displayName = 'AnchorButton'

/**
 * @group UI
 */
export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	return <BaseButton {...props} ref={ref} Component={'button'} />
}))
Button.displayName = 'Button'

export const BaseButton = memo(forwardRef<any, BaseButtonProps>((props, ref) => {
	const { Component, intent, size, flow, distinction, elevation, justification, loading, active, bland, children, scheme, ...rest } =
		props

	if (props.disabled === true) {
		rest['aria-disabled'] = true
		rest['tabIndex'] = -1
	}

	if (props.Component === 'button') {
		(rest as HTMLButtonElementProps).type = props.type !== undefined ? props.type : 'button'
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
			toEnumClass('elevation-', elevation),
		),
		ref: ref,
		...(props.disabled ? {
			href: null,
			onClick: null,
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
}))
BaseButton.displayName = 'BaseButton'
