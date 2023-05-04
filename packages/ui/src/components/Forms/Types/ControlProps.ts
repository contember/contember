import { ControlDistinction, Intent, Scheme, Size, ValidationState } from '../../../types'

/**
 * Returns new type where all the properties are required but some of them may be undefined
 */
export type All<T> = {
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
}

export type ControlProps<V> =
	& ControlDisplayProps
	& ValidationStateProps
	& ControlStateProps
	& ControlFocusProps
	& ControlConstraintProps<V>
	& ControlValueProps<V>

export type AllControlProps<V> = Omit<All<ControlProps<V>>, 'type'>
export type ControlPropsKeys<V> = keyof ControlProps<V>

export type VisuallyDependentControlProps =
	& ControlStateProps
	& ControlDisplayProps
	& Pick<ValidationStateProps, 'validationState'>

export type AllVisuallyDependentControlProps = Omit<All<VisuallyDependentControlProps>, 'type'>
