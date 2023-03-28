import { CSSProperties, HTMLAttributes } from 'react'
import { ControlDistinction, Intent, Scheme, Size, ValidationState } from '../../../types'

/**
 * Returns new type where all the properties are required
 * and previously optional properties will accept undefined.
 */
export type NonOptional<T> = {
	[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : (T[P] | undefined);
}

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

export interface ControlValueProps<V> {
	defaultValue?: V | null | undefined
	onChange?: (value?: V | null) => void
	notNull?: boolean
	value?: V | null
}

export interface ControlConstraintProps<V> {
	max?: V | null
	maxLength?: number
	min?: V | null
	minLength?: number
	pattern?: string
	step?: number
}

export type ControlProps<V> =
	& ControlDisplayProps
	& ValidationStateProps
	& ControlStateProps
	& ControlFocusProps
	& ControlConstraintProps<V>
	& ControlValueProps<V>

export type NonOptionalControlProps<V> = Omit<NonOptional<ControlProps<V>>, 'type'>
export type ControlPropsKeys<V> = keyof ControlProps<V>

export type VisuallyDependentControlProps =
	& ControlStateProps
	& ControlDisplayProps
	& Pick<ValidationStateProps, 'validationState'>

export type NonOptionalVisuallyDependentControlProps = Omit<NonOptional<VisuallyDependentControlProps>, 'type'>
