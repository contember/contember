import { ComponentClassNameProps } from '@contember/utilities'
import { ReactNode } from 'react'
import type {
	HTMLAnchorElementProps,
	HTMLButtonElementProps,
	Intent,
	Justification,
	Scheme,
} from '../../../types'
import { Default } from '../../../types'
import { StackOwnProps } from '../../Stack'

export interface ButtonBasedProps extends Omit<HTMLButtonElementProps, 'ref' | 'size' | 'className'> {
	Component: 'button'
}

export interface AnchorBasedProps extends Omit<HTMLAnchorElementProps, 'ref' | 'size' | 'className'> {
	Component: 'a'
}

export interface ButtonOwnProps extends DeprecatedButtonOwnProps, ComponentClassNameProps {
	accent?: false | 'strong' | 'theme'
	active?: boolean
	align?: 'start' | 'center' | 'end' | 'stretch'
	borderRadius?: Exclude<StackOwnProps['gap'], 'large' | 'larger'> | 'full'
	children?: ReactNode
	display?: 'inline' | 'block'
	disabled?: boolean
	distinction?: 'primary' | 'toned' | 'outlined' | 'seamless' | 'inverse' | DeprecatedButtonDefault
	elevated?: boolean
	focusRing?: boolean
	inset?: Exclude<StackOwnProps['gap'], 'large' | 'larger'>
	intent?: Intent
	justify?: 'start' | 'center' | 'end' | 'space-around' | 'space-between' | 'space-evenly'
	loading?: boolean
	padding?: Exclude<StackOwnProps['gap'], 'large' | 'larger'> | DeprecatedButtonPadding
	scheme?: Scheme
	square?: boolean
	size?: 'small' | 'medium' | 'large' | DeprecatedButtonDefault
}

export type ButtonProps = ButtonOwnProps & Omit<ButtonBasedProps, 'Component'>
export type AnchorButtonProps = ButtonOwnProps & Omit<AnchorBasedProps, 'Component'>
export type BaseButtonProps = ButtonOwnProps & (ButtonBasedProps | AnchorBasedProps)

export interface ButtonListProps extends ComponentClassNameProps, DeprecatedButtonListProps {
	children?: ReactNode
	direction?: 'horizontal' | 'vertical'
	display?: 'block' | 'inline'
	gap?: StackOwnProps['gap']
	inset?: Exclude<StackOwnProps['gap'], boolean | 'large' | 'larger'> | 'border'
	/**
	 * @deprecated Use `direction` instead
	 */
	orientation?: 'horizontal' | 'vertical' | DeprecatedButtonDefault
	size?: 'small' | 'medium' | 'large' | DeprecatedButtonDefault
}

export interface ButtonGroupProps extends ComponentClassNameProps, DeprecatedButtonGroupProps {
	borderRadius?: Exclude<StackOwnProps['gap'], 'large' | 'larger'> | 'full'
	children?: ReactNode
	direction?: 'horizontal' | 'vertical'
	display?: 'block' | 'inline'
	focusRing?: boolean
	inset?: Exclude<StackOwnProps['gap'], boolean | 'large' | 'larger'> | 'border'
	/**
	 * @deprecated Use `direction` instead
	*/
	orientation?: 'horizontal' | 'vertical' | DeprecatedButtonDefault
	size?: 'small' | 'medium' | 'large' | DeprecatedButtonDefault
}

/** @deprecated Use `ButtonProps['distinction']` instead */
export type ButtonDistinction = Default | 'primary' | 'toned' | 'outlined' | 'seamless'
/** @deprecated Use `ButtonProps['display']` instead */
export type ButtonListFlow = Default | 'inline' | 'block'
/** @deprecated Use `elevated` prop instead */
export type ButtonElevation = Default | 'none'
/** @deprecated Use `display` prop instead */
export type ButtonGroupFlow = Default | 'block'
/** @deprecated Use combination of `display="block"` and `padding="large"` instead */
export type ButtonFlow = Default | 'circular' | 'squarish' | 'generous' | 'block' | 'generousBlock'
/** @deprecated No alternative */
export type DeprecatedButtonPadding = Default | 'small'
/** @deprecated No alternative */
export type ButtonGroupOrientation = Default | 'horizontal' | 'vertical'

/** @deprecated Omit the 'default' prop value */
export type DeprecatedButtonDefault = Default
/** @deprecated No alternative */
export interface DeprecatedButtonOwnProps {
	/** @deprecated Use `distinction`, `theme` or `accent={false}` props instead to suppress button visuals */
	bland?: boolean
	/** @deprecated Use `elevated` instead */
	elevation?: ButtonElevation
	/** @deprecated Use combination of `display`, `padding` and `borderRadius` props instead */
	flow?: ButtonFlow
	/** @deprecated Use `justify` */
	justification?: Justification
}
/** @deprecated No alternative */
export interface DeprecatedButtonGroupProps {
	/** @deprecated Use `display` instead */
	flow?: ButtonGroupFlow

	/** @deprecated No alterative */
	isTopToolbar?: boolean
}
/** @deprecated No alternative */
export interface DeprecatedButtonListProps {
	/** @deprecated Use `display` instead */
	flow?: ButtonListFlow
}
