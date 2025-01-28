import { ErrorAccessor } from '@contember/react-binding'
import * as React from 'react'

export type FormInputHandlerContext<State = unknown> = {
	state?: State
	setState: (state: State) => void
}

export type FormInputHandler<State = unknown> = {
	parseValue: (value: string, ctx: FormInputHandlerContext<State>) => any
	formatValue: (value: any, ctx: FormInputHandlerContext<State>) => string
	defaultInputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

export type FormFieldState = {
	htmlId: string
	errors: ErrorAccessor.Error[]
	required: boolean
	dirty: boolean
	field?: {
		entityName: string
		fieldName: string
		enumName?: string
	}
}
