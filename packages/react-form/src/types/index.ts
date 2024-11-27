import { ErrorAccessor } from '@contember/react-binding'
import * as React from 'react'

export type FormInputHandler = {
	parseValue: (value: string) => any
	formatValue: (value: any) => string
	defaultInputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

export type FormFieldState = {
	id: string
	errors: ErrorAccessor.Error[]
	required: boolean
	dirty: boolean
}
