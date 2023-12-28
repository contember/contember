import { ComponentClassNameProps } from '@contember/utilities'
import { ReactNode } from 'react'
import type {
	HTMLAnchorElementProps,
	HTMLButtonElementProps,
	Intent,
	Scheme,
} from '../../../types'
import { StackOwnProps } from '../../Stack'

export interface ButtonBasedProps extends Omit<HTMLButtonElementProps, 'ref' | 'size' | 'className'> {
	Component: 'button'
}

export interface AnchorBasedProps extends Omit<HTMLAnchorElementProps, 'ref' | 'size' | 'className'> {
	Component: 'a'
}

export interface ButtonOwnProps extends ComponentClassNameProps {
	accent?: false | 'strong' | 'theme'
	active?: boolean
	align?: 'start' | 'center' | 'end' | 'stretch'
	borderRadius?: Exclude<StackOwnProps['gap'], 'large' | 'larger'> | 'full'
	children?: ReactNode
	display?: 'inline' | 'block'
	disabled?: boolean
	distinction?: 'primary' | 'toned' | 'outlined' | 'seamless' | 'inverse'
	elevated?: boolean
	focusRing?: boolean
	inset?: Exclude<StackOwnProps['gap'], 'large' | 'larger'>
	intent?: Intent
	justify?: 'start' | 'center' | 'end' | 'space-around' | 'space-between' | 'space-evenly'
	loading?: boolean
	padding?: Exclude<StackOwnProps['gap'], 'large' | 'larger'>
	scheme?: Scheme
	square?: boolean
	size?: 'small' | 'medium' | 'large'
}

export type ButtonProps = ButtonOwnProps & Omit<ButtonBasedProps, 'Component'>
export type AnchorButtonProps = ButtonOwnProps & Omit<AnchorBasedProps, 'Component'>
export type BaseButtonProps = ButtonOwnProps & (ButtonBasedProps | AnchorBasedProps)

export interface ButtonListProps extends ComponentClassNameProps {
	children?: ReactNode
	direction?: 'horizontal' | 'vertical'
	display?: 'block' | 'inline'
	gap?: StackOwnProps['gap']
	inset?: Exclude<StackOwnProps['gap'], boolean | 'large' | 'larger'> | 'border'
	size?: 'small' | 'medium' | 'large'
}

export interface ButtonGroupProps extends ComponentClassNameProps {
	borderRadius?: Exclude<StackOwnProps['gap'], 'large' | 'larger'> | 'full'
	children?: ReactNode
	direction?: 'horizontal' | 'vertical'
	display?: 'block' | 'inline'
	focusRing?: boolean
	inset?: Exclude<StackOwnProps['gap'], boolean | 'large' | 'larger'> | 'border'
	size?: 'small' | 'medium' | 'large'
}
