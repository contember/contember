import { ReactNode } from 'react'

export interface ChoiceFieldSingleOption<Value = unknown> {
	label: ReactNode
	searchKeywords: string
	description?: ReactNode
	value: Value
	key: string
}

export type ChoiceFieldOptions<Value = unknown> = ChoiceFieldSingleOption<Value>[]
