import { Component, SugaredField, SugaredFieldProps, useField } from '@contember/binding'
import type { FunctionComponent, ReactNode } from 'react'
import { FieldFallbackView, FieldFallbackViewPublicProps } from './FieldFallbackView'

export type DateFieldViewProps = {
	field: SugaredFieldProps['field']
} & (
	| { format?: ((date: Date) => ReactNode) | Intl.DateTimeFormatOptions; locale?: never }
	| { format?: Intl.DateTimeFormatOptions; locale: string | string[] }
) &
	FieldFallbackViewPublicProps

/**
 * @group Field Views
 */
export const DateFieldView: FunctionComponent<DateFieldViewProps> = Component(
	({ field, locale, format, fallback, fallbackStyle }) => {
		const dateField = useField<string>(field)

		if (dateField.value === null) {
			return <FieldFallbackView fallback={fallback} fallbackStyle={fallbackStyle} />
		}

		// dateField.value is created on server by Date.toISOString() and therefore always in UTC
		const date = new Date(dateField.value)

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
			<FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
		</>
	),
	'DateFieldView',
)
