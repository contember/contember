import { ColorSchemeContext, useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, contentThemeClassName, controlsThemeClassName, dataAttribute, deprecate, fallback } from '@contember/utilities'
import { createElement, forwardRef, memo } from 'react'
import type { HTMLButtonElementProps } from '../../../types'
import { Spinner } from '../../Spinner/Spinner'
import { Text } from '../../Typography'
import { AnchorButtonProps, BaseButtonProps, ButtonProps } from './Types'

/**
 * @example
 * ```tsx
 * <AnchorButton href="#id">Go to id</AnchorButton>
 * ```
 *
 * @group UI
 */
export const AnchorButton = memo(forwardRef<HTMLAnchorElement, AnchorButtonProps>((props, ref) => {
	return <BaseButton {...props} ref={ref} Component="a" />
}))
AnchorButton.displayName = 'Interface.AnchorButton'

/**
 * @group UI
 *
 * @example
 * ```tsx
 * <Button onClick={() => alert('clicked')}>Click me</Button>
 * ```
 *
 * @example
 * Pressed/active state, e.g. for toggle buttons:
 * ```tsx
 * <Button active>Active</Button>
 * ```
 *
 * @example
 * Disabled state:
 * ```tsx
 * <Button disabled>Disabled</Button>
 * ```
 *
 * @example
 * Size variants:
 * ```tsx
 * <Button>Default</Button>
 * <Button size="small">Small</Button>
 * <Button size="large">Large</Button>
 * ```
 *
 * @example
 * Intent variants:
 * ```tsx
 * <Button intent="default">Default</Button>
 * <Button intent="primary">Primary</Button>
 * <Button intent="secondary">Secondary</Button>
 * <Button intent="tertiary">Tertiary</Button>
 * <Button intent="success">Success</Button>
 * <Button intent="warn">Warning</Button>
 * <Button intent="danger">Danger</Button>
 * ```
 *
 * @example
 * Distinction variants:
 * ```tsx
 * <Button distinction="default">Default</Button>
 * <Button distinction="primary">Primary</Button>
 * <Button distinction="toned">Toned</Button>
 * <Button distinction="outlined">Outlined</Button>
 * <Button distinction="seamless">Seamless</Button>
 * ```
 *
 * @example
 * Display variants:
 * ```tsx
 * <Button>Inline</Button>
 * <Button display="block">Block</Button>
 * ```
 *
 * @example
 * Change physical size of the button withoud changing the visual with `inset` prop:
 * ```tsx
 * <Button distinction="seamless" inset>Inset</Button>
 * ```
 */
export const Button = memo(forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
	return <BaseButton {...props} ref={ref} Component="button" />
}))
Button.displayName = 'Interface.Button'

export const BaseButton = memo(forwardRef<any, BaseButtonProps>(({
	Component,
	active,
	align,
	bland,
	borderRadius = true,
	className: classNameProp,
	componentClassName = 'button',
	display = 'inline',
	children,
	disabled,
	distinction,
	elevated = false,
	elevation,
	flow,
	intent,
	type,
	justification,
	justify = 'center',
	loading,
	inset,
	padding = true,
	scheme: schemeProp,
	size,
	square = false,
	...rest
}, ref) => {
	// TODO: deprecated since v1.3.0
	deprecate('1.3.0', bland !== undefined, '`bland` prop', '`distinction` prop')

	deprecate('1.3.0', flow === 'squarish', 'flow="squarish"', '`square={true}`')
	deprecate('1.3.0', flow === 'circular', 'flow="circular"', '`square={true} borderRadius="full"`')
	square = fallback(square, flow === 'squarish' || flow === 'circular', true)
	borderRadius = fallback(borderRadius, flow === 'circular', 'full')
	deprecate('1.3.0', flow === 'default', '`flow="default"`', 'omitted `flow` prop')
	deprecate('1.3.0', flow === 'block', '`flow="block"`', '`display="block"`')
	deprecate('1.3.0', flow === 'generous', '`flow="generous"`', '`padding="large"`')
	deprecate('1.3.0', flow === 'generousBlock', '`flow="generousBlock"`', '`display="block" padding="large"`')
	display = fallback(display, flow === 'block' || flow === 'generousBlock', 'block')
	padding = fallback(padding, flow === 'generous' || flow === 'generousBlock', 'padding')

	deprecate('1.3.0', typeof elevated !== 'boolean', '`elevate` prop', '`elevate` prop')
	elevated = fallback(elevated, typeof elevation !== 'boolean', elevation === 'default' ? true : false)

	deprecate('1.3.0', justification !== undefined, '`justification` prop', '`justify` prop')
	justify = fallback(justify, justification !== undefined, ({ default: 'center', justifyStart: 'start', justifyCenter: 'center', justifyEnd: 'end' } as const)[justification ?? 'default'])

	deprecate('1.3.0', padding === 'small', 'padding="small"', 'padding="gap"')
	padding = fallback(padding, padding === 'small', 'gap')

	deprecate('1.3.0', distinction === 'default', '`distinction="default"`', 'omitted `distinction` prop')
	distinction = fallback(distinction, distinction === 'default', undefined)

	if (disabled === true) {
		rest['aria-disabled'] = true
		rest['tabIndex'] = -1
	}

	if (Component === 'button') {
		(rest as HTMLButtonElementProps).type = type !== undefined ? type : 'button'
	}

	const themeIntent = !disabled ? intent : 'default'
	const className = useClassNameFactory(componentClassName)
	const colorScheme = useColorScheme()
	const scheme = schemeProp ?? colorScheme

	return createElement(Component, {
		...rest,
		'data-active': dataAttribute(active),
		'data-align': dataAttribute(align),
		// TODO: deprecated since v1.3.0
		'data-bland': dataAttribute(bland),
		'data-border-radius': dataAttribute(borderRadius),
		'data-disabled': dataAttribute(disabled),
		'data-display': dataAttribute(display),
		'data-distinction': dataAttribute(distinction),
		'data-elevated': dataAttribute(elevated),
		'data-inset': dataAttribute(inset ?? (distinction === 'seamless' ? true : undefined)),
		'data-intent': dataAttribute(intent),
		'data-justify': dataAttribute(justify),
		'data-loading': dataAttribute(loading),
		'data-padding': dataAttribute(padding),
		'data-size': dataAttribute(size),
		'data-square': dataAttribute(square),
		disabled,
		'className': className(null, [
			contentThemeClassName(distinction === 'default' ? null : themeIntent),
			controlsThemeClassName(themeIntent),
			colorSchemeClassName(scheme),
			classNameProp,
		]),
		type,
		ref,
		...(disabled ? {
			href: null,
			onClick: null,
		} : undefined),
	}, (<ColorSchemeContext.Provider value={scheme}>
		<div className={className('content')}>
			{(typeof children === 'string' || typeof children === 'number')
				? <Text>{`${children}`}</Text>
				: children
			}
		</div>
		{loading && (
			<span className={className('spinner')}>
				<Spinner />
			</span>
		)}
	</ColorSchemeContext.Provider>))
}))
BaseButton.displayName = 'Interface.BaseButton'
