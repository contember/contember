import { FieldAccessor, SchemaColumn, SchemaKnownColumnType } from '@contember/react-binding'
import { useMemo } from 'react'
import { FormInputHandler } from '../types'

export const useFormInputHandler = (field: FieldAccessor, { formatValue, parseValue }: Partial<FormInputHandler>): FormInputHandler => {
	return useMemo(() => {
		const schema = field.schema
		const columnType = schema.type
		const handlerFactory = ColumnTypeHandlerFactories[columnType as SchemaKnownColumnType] ?? defaultHandlerFactory
		const handler = handlerFactory(schema, field.getAccessor)
		return {
			defaultInputProps: handler.defaultInputProps,
			formatValue: formatValue ?? handler.formatValue,
			parseValue: parseValue ?? handler.parseValue,
		}
	}, [field.getAccessor, field.schema, formatValue, parseValue])
}

type ColumnTypeHandlerFactory = (column: SchemaColumn, getAccessor: FieldAccessor.GetFieldAccessor) => FormInputHandler

const defaultHandlerFactory: ColumnTypeHandlerFactory = (schema, field) => ({
	parseValue: (value: string) => {
		if (value === '' && schema.nullable && field().valueOnServer === null) {
			return null
		}
		return value
	},
	formatValue: (value: string | null) => value ?? '',
})

const ColumnTypeHandlerFactories: Record<SchemaKnownColumnType, ColumnTypeHandlerFactory | undefined> = {
	String: defaultHandlerFactory,
	Integer: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = parseInt(value, 10)
			return isNaN(parsed) ? null : parsed
		},
		formatValue: (value: number | null) => {
			return value === null ? '' : value.toString(10)
		},
		defaultInputProps: {
			type: 'number',
		},
	}),
	Double: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = parseFloat(value)
			return isNaN(parsed) ? null : parsed
		},
		formatValue: (value: number | null) => {
			return value === null ? '' : value.toString(10)
		},
		defaultInputProps: {
			type: 'number',
		},
	}),

	Date: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = Date.parse(value)
			return isNaN(parsed) ? null : (new Date(parsed)).toISOString().split('T')[0]
		},
		formatValue: (value: string | null) => {
			const parsed = value ? Date.parse(value) : null
			return !parsed || isNaN(parsed) ? '' : new Date(parsed).toISOString().split('T')[0]
		},
		defaultInputProps: {
			type: 'date',
		},
	}),
	DateTime: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}

			const parsed = Date.parse(value)
			return isNaN(parsed) ? null : (new Date(parsed)).toISOString()
		},
		formatValue: (value: string | null) => {
			const parsed = value ? Date.parse(value) : null
			return !parsed || isNaN(parsed) ? '' : toLocalDate(new Date(parsed))
		},
		defaultInputProps: {
			type: 'datetime-local',
		},
	}),
	Bool: undefined,
	Enum: undefined,
	Uuid: undefined,
}

const toLocalDate = (date: Date) => {
	const pad = (num: number, length: number = 2) => {
		const str = num.toString()
		return '0'.repeat(Math.max(0, length - str.length)) + str
	}

	return pad(date.getFullYear(), 4) +
		'-' + pad(date.getMonth() + 1) +
		'-' + pad(date.getDate()) +
		'T' + pad(date.getHours()) +
		':' + pad(date.getMinutes()) +
		':' + pad(date.getSeconds())
}
