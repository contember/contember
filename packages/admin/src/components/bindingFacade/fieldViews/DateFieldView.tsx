import { Component, SugaredField, SugaredFieldProps, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'

export interface DateFieldViewProps {
	field: SugaredFieldProps['field']
	locale?: string
	format?: Intl.DateTimeFormatOptions | ((date: Date) => React.ReactNode)
	fallback?: React.ReactNode
}

export const DateFieldView = Component<DateFieldViewProps>(
	({ field, locale, format, fallback = null }) => {
		const dateField = useRelativeSingleField<string>(field)

		if (!dateField.currentValue) {
			return <>{fallback}</>
		}

		// dateField.currentValue is created on server by Date.toISOString() and therefore always in UTC
		const date = new Date(dateField.currentValue)

		if (format === undefined) {
			return <>{date.toLocaleString()}</>
		}

		if (typeof format === 'function') {
			return <>{format(date)}</>
		}

		const intl = new Intl.DateTimeFormat(locale ?? 'default', { timeZone: 'UTC', ...format })
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
