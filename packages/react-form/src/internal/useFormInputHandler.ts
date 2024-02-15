import { FieldAccessor, SchemaColumn, SchemaKnownColumnType } from '@contember/binding'
import * as React from 'react'
import { useMemo } from 'react'

export const useFormInputHandler = (field: FieldAccessor) => {
	return useMemo(() => {
		const schema = field.schema
		const columnType = schema.type
		const handlerFactory = ColumnTypeHandlerFactories[columnType as SchemaKnownColumnType]
		if (!handlerFactory) {
			throw new Error(`Column type ${columnType} is not supported yet`)
		}
		return handlerFactory(schema, field.getAccessor)
	}, [field.getAccessor, field.schema])
}

type ColumnTypeHandlerFactory = (column: SchemaColumn, getAccessor: FieldAccessor.GetFieldAccessor) => {
	parseValue: (value: string) => any
	formatValue: (value: any) => string
	defaultInputProps?: React.InputHTMLAttributes<HTMLInputElement>
}

const ColumnTypeHandlerFactories: Record<SchemaKnownColumnType, ColumnTypeHandlerFactory> = {
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
	String: (schema, field) => ({
		parseValue: (value: string) => {
			if (value === '' && schema.nullable && field().valueOnServer === null) {
				return null
			}
			return value
		},
		formatValue: (value: string | null) => value ?? '',
	}),
	Date: () => ({
		parseValue: (value: string) => {
			if (value === '') {
				return null
			}
			const parsed = Date.parse(value)
			return isNaN(parsed) ? null : new Date(parsed)
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
			return isNaN(parsed) ? null : new Date(parsed)
		},
		formatValue: (value: string | null) => {
			const parsed = value ? Date.parse(value) : null
			return !parsed || isNaN(parsed) ? '' : new Date(parsed).toISOString().substring(0, 16)
		},
		defaultInputProps: {
			type: 'datetime-local',
		},
	}),
	Bool: () => {
		throw new Error('Boolean column type is not supported yet')
	},
	Enum: () => {
		throw new Error('Enum column type is not supported yet')
	},
	Uuid: () => {
		throw new Error('UUID column type is not supported yet')
	},
}
