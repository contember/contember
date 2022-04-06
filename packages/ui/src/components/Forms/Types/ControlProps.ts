import { HTMLAttributes } from 'react'
import { ControlDistinction, Intent, Scheme, Size, ValidationState } from '../../../types'

/**
 * Returns new type where all the properties are required but some of them may be undefined
 */
type All<T> = {
	[P in keyof Required<T>]: Pick<T, P> extends Required<Pick<T, P>> ? T[P] : (T[P] | undefined);
}

export interface ValidationSteteProps {
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
	className?: HTMLAttributes<HTMLElement>['className']
	distinction?: ControlDistinction
	id?: string
	intent?: Intent
	scheme?: Scheme
	size?: Size
	type?: never
}

export interface ControlValueProps<V> {
	defaultValue?: V | null | undefined
	onChange?: (value?: V | null) => void
	max?: V | null
	min?: V | null
	name?: string
	notNull?: boolean
	placeholder?: string | null
	value?: V | null
}

export type ControlProps<V> =
	& ControlDisplayProps
	& ValidationSteteProps
	& ControlStateProps
	& ControlFocusProps
	& ControlValueProps<V>

export type AllControlProps<V> = Omit<All<ControlProps<V>>, 'type'>
export type ControlPropsKeys<V> = keyof ControlProps<V>

export type VisuallyDependententControlProps =
	ControlStateProps
	& ControlDisplayProps
	& Pick<ValidationSteteProps, 'validationState'>
export type AllVisuallyDependententControlProps = Omit<All<VisuallyDependententControlProps>, 'type'>
