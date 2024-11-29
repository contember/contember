import { ErrorAccessor } from '@contember/react-binding'
import * as React from 'react'

export type FormInputHandler = {
	parseValue: (value: string) => any
	formatValue: (value: any) => string
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
