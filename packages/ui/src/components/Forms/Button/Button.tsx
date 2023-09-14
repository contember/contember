import { ColorSchemeContext, useClassNameFactory, useColorScheme } from '@contember/react-utils'
import { colorSchemeClassName, controlsThemeClassName, dataAttribute } from '@contember/utilities'
import { createElement, forwardRef, memo } from 'react'
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
 * Change physical size of the button without changing the visual with `inset` prop:
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
	accent = 'theme',
	active,
	align,
	borderRadius = true,
	className: classNameProp,
	componentClassName = 'button',
	display = 'inline',
	children,
	disabled,
	distinction,
	elevated = false,
	focusRing = true,
	intent,
	type,
	justify = 'center',
	loading,
	inset,
	padding = true,
	scheme: schemeProp,
	size,
	square = false,
	...rest
}, ref) => {
	if (disabled === true) {
		rest['aria-disabled'] = true
		rest['tabIndex'] = -1
	}

	const className = useClassNameFactory(componentClassName)
	const colorScheme = useColorScheme()
	const scheme = schemeProp ?? colorScheme

	return createElement(Component, {
		...rest,
		'data-accent': dataAttribute(accent),
		'data-active': dataAttribute(active),
		'data-align': dataAttribute(align),
		'data-border-radius': dataAttribute(borderRadius),
		'data-disabled': dataAttribute(disabled),
		'data-display': dataAttribute(display),
		'data-distinction': dataAttribute(distinction),
		'data-elevated': dataAttribute(elevated),
		'data-focus-ring': dataAttribute(focusRing),
		'data-inset': dataAttribute(inset ?? (distinction === 'seamless' ? true : undefined)),
		'data-intent': dataAttribute(intent),
		'data-justify': dataAttribute(justify),
		'data-loading': dataAttribute(loading),
		'data-padding': dataAttribute(padding),
		'data-size': dataAttribute(size),
		'data-square': dataAttribute(square),
		disabled,
		'className': className(null, [
			controlsThemeClassName(intent),
			colorSchemeClassName(scheme),
			classNameProp,
		]),
		'type': type ?? (Component === 'button' ? 'button' : undefined),
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
