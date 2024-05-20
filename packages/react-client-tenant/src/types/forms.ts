import { SetStateAction } from 'react'

export type FormState =
	| 'loading'
	| 'initial'
	| 'submitting'
	| 'error'
	| 'success'

type FormValueType = Record<string, unknown>;

export type FormErrorCode = 'UNKNOWN_ERROR'

export type FormError<V extends FormValueType, E extends string> = {
	field?: keyof V
	code: FormErrorCode | E
	developerMessage?: string
};

export interface FormContextValue<V extends FormValueType, E extends string, S extends string = never> {
	values: V
	state: FormState | S
	setValues: (values: SetStateAction<V>) => void
	setValue: <F extends keyof V>(field: F, value: V[F]) => void
	errors: FormError<V, E>[]
}
