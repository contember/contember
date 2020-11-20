import { Component, SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import * as React from 'react'

export type DateFieldViewProps = {
	field: SugaredFieldProps['field']
	fallback?: React.ReactNode
} & (
	| { format?: ((date: Date) => React.ReactNode) | Intl.DateTimeFormatOptions; locale?: never }
	| { format?: Intl.DateTimeFormatOptions; locale: string | string[] }
)

export const DateFieldView = Component<DateFieldViewProps>(
	({ field, locale, format, fallback = null }) => {
		const dateField = useField<string>(field)

		if (!dateField.currentValue) {
			return <>{fallback}</>
		}

		// dateField.currentValue is created on server by Date.toISOString() and therefore always in UTC
		const date = new Date(dateField.currentValue)

		if (locale === undefined) {
			if (format === undefined) {
				return <>{date.toLocaleString()}</>
			}

			if (typeof format === 'function') {
				return <>{format(date)}</>
			}
		}

		const intl = new Intl.DateTimeFormat(locale ?? 'default', { ...format, timeZone: 'UTC' })
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
