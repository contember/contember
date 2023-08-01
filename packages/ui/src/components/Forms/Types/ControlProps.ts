import { NonOptional } from '@contember/utilities'
import { CSSProperties } from 'react'
import { ControlDistinction, HTMLInputElementProps, Intent, Scheme, Size, ValidationState } from '../../../types'

export interface ValidationStateProps {
	onValidationStateChange?: (error?: string) => void
	validationState?: ValidationState
}

export interface ControlStateProps {
	active?: boolean
	disabled?: boolean
	loading?: boolean
	readOnly?: boolean
	required?: boolean
	focused?: boolean
	hovered?: boolean
}

export interface ControlFocusProps {
	onBlur?: () => void
	onFocus?: () => void
	onFocusChange?: (isFocused: boolean) => void
}

export interface ControlDisplayProps {
	className?: string
	distinction?: ControlDistinction
	id?: string
	intent?: Intent
	scheme?: Scheme
	size?: Size
	type?: never
	placeholder?: string | null
	name?: string
	style?: CSSProperties;
}

export type ControlValueProps<V, NN extends boolean = boolean> = {
	defaultValue?: NN extends true ? Exclude<V, null> : V | null
	onChange?: (value: NN extends true ? Exclude<V, null> : V | V | null) => void
	value?: NN extends true ? Exclude<V, null> : V | null
	notNull?: NN
}

export interface ControlConstraintProps<V> {
	max?: V | null
	maxLength?: number
	min?: V | null
	minLength?: number
	pattern?: string
	step?: number
}

export type ControlProps<V, NN extends boolean = boolean> =
	& ControlDisplayProps
	& ValidationStateProps
	& ControlStateProps
	& ControlFocusProps
	& ControlConstraintProps<V>
	& ControlValueProps<V, NN>

export type NonOptionalControlProps<V, NN extends boolean = boolean> = Omit<NonOptional<ControlProps<V, NN>>, 'type'>
export type ControlPropsKeys<V> = keyof ControlProps<V>

export type VisuallyDependentControlProps =
	& ControlStateProps
	& ControlDisplayProps
	& Pick<ValidationStateProps, 'validationState'>

export type NonOptionalVisuallyDependentControlProps = Omit<NonOptional<VisuallyDependentControlProps>, 'type'>
