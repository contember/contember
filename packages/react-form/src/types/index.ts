import * as React from 'react'

export type FormInputHandler = {
	parseValue: (value: string) => any
	formatValue: (value: any) => string
	defaultInputProps?: React.InputHTMLAttributes<HTMLInputElement>
}
