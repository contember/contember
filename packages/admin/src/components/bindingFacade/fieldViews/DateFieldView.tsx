import { Component, SugaredField, SugaredFieldProps, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'

export interface DateFieldViewProps {
	field: SugaredFieldProps['field']
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
			<SugaredField field={props.field} />
			{props.fallback}
		</>
	),
	'DateFieldView',
)
