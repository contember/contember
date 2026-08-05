import { SetStateAction } from 'react'

export type FormState =
	| 'loading'
	| 'initial'
	| 'submitting'
	| 'error'
	| 'success'

type FormValueType = Record<string, unknown>

/**
 * Codes any form can raise, whatever it submits. `FORBIDDEN` is separate from `UNKNOWN_ERROR`
 * because a permission rejection is an answer, not a failure — the user cannot retry their way out
 * of it, so telling them to try again later is wrong.
 */
export type FormErrorCode = 'UNKNOWN_ERROR' | 'FORBIDDEN'

export type FormError<V extends FormValueType, E extends string> = {
	field?: keyof V
	code: FormErrorCode | E
	developerMessage?: string
}

export interface FormContextValue<V extends FormValueType, E extends string, S extends string = never> {
	values: V
	state: FormState | S
	setValues: (values: SetStateAction<V>) => void
	setValue: <F extends keyof V>(field: F, value: V[F]) => void
	errors: FormError<V, E>[]
}
