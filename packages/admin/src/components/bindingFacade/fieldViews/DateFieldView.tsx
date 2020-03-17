import { Component, Field, FieldProps, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'

export interface DateFieldViewProps {
	field: FieldProps['field']
	format?: Intl.DateTimeFormatOptions | ((date: Date) => React.ReactNode)
	fallback?: React.ReactNode
}

export const DateFieldView = Component<DateFieldViewProps>(
	({ field, format, fallback = null }) => {
		const dateField = useRelativeSingleField<string>(field)

		if (!dateField.currentValue) {
			return <>{fallback}</>
		}
		const date = new Date(dateField.currentValue)

		if (format === undefined) {
			return <>{date.toLocaleString()}</>
		}

		if (typeof format === 'function') {
			return <>{format(date)}</>
		}

		const intl = new Intl.DateTimeFormat('default', format)
		return <>{intl.format(date)}</>
	},
	props => (
		<>
			<Field field={props.field} />
			{props.fallback}
		</>
	),
	'DateFieldView',
)
