import { ColorSchemeContext, useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName, dataAttribute } from '@contember/utilities'
import { ReactNode, createElement, forwardRef, memo } from 'react'
import type {
	HTMLAnchorElementProps,
	HTMLButtonElementProps,
	Intent,
	Justification,
	Scheme,
	Size,
} from '../../../types'
import { toEnumClass, toEnumViewClass, toStateClass, toViewClass } from '../../../utils'
import { Spinner } from '../../Spinner/Spinner'
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
	return <BaseButton {...props} ref={ref} Component="a" />
}))
AnchorButton.displayName = 'AnchorButton'

/**
 * @group UI
 */
export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	return <BaseButton {...props} ref={ref} Component="button" />
}))
Button.displayName = 'Button'

export const BaseButton = memo(forwardRef<any, BaseButtonProps>((props, ref) => {
	const { Component, intent, size, flow, distinction = 'default', elevation = 'none', justification = 'justifyCenter', loading, active, bland, children, scheme: schemeProp, ...rest } =
		props

	if (props.disabled === true) {
		rest['aria-disabled'] = true
		rest['tabIndex'] = -1
	}

	if (props.Component === 'button') {
		(rest as HTMLButtonElementProps).type = props.type !== undefined ? props.type : 'button'
	}

	const themeIntent = !props.disabled ? intent : 'default'
	const componentClassName = useClassNameFactory('button')
	const colorScheme = useColorScheme()
	const scheme = schemeProp ?? colorScheme

	const attrs = {
		'data-active': dataAttribute(active),
		'data-bland': dataAttribute(bland),
		'data-disabled': dataAttribute(props.disabled),
		'data-distinction': dataAttribute(distinction),
		'data-elevation': dataAttribute(elevation),
		'data-flow': dataAttribute(flow),
		'data-intent': dataAttribute(intent),
		'data-justification': dataAttribute(justification),
		'data-loading': dataAttribute(loading),
		'data-size': dataAttribute(size),
		'className': componentClassName(null, [
			contentThemeClassName(props.distinction === 'default' ? null : themeIntent),
			controlsThemeClassName(themeIntent),
			colorSchemeClassName(scheme),
			rest.className,
		]),
		'ref': ref,
		...(props.disabled ? {
			href: null,
			onClick: null,
		} : undefined),
	}
	const content = (
		<ColorSchemeContext.Provider value={scheme}>
			<div className={componentClassName('content')}>{children}</div>
			{loading && (
				<span className={componentClassName('spinner')}>
					<Spinner />
				</span>
			)}
		</ColorSchemeContext.Provider>
	)

	return createElement(Component, { ...rest, ...attrs }, content)
}))
BaseButton.displayName = 'Interface.BaseButton'
