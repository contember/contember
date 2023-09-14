import { Component, SugaredField, SugaredFieldProps, useField } from '@contember/react-binding'
import type { FunctionComponent, ReactNode } from 'react'
import { useMessageFormatter } from '../../../i18n'
import { FieldFallbackView, FieldFallbackViewPublicProps } from './FieldFallbackView'
import { fieldViewDictionary } from './fieldViewDictionary'

export type BooleanFieldViewProps = {
	field: SugaredFieldProps['field']
	booleanStyle?: 'yesNo' | 'checkCross' | 'oneZero'
	format?: (date: boolean) => ReactNode
} & FieldFallbackViewPublicProps

/**
 * @group Field Views
 */
export const BooleanFieldView: FunctionComponent<BooleanFieldViewProps> = Component(
	({ field, booleanStyle, format, fallback, fallbackStyle }) => {
		const booleanField = useField<boolean>(field)
		const formatMessage = useMessageFormatter(fieldViewDictionary)

		if (booleanField.value === null) {
			return <FieldFallbackView fallback={fallback} fallbackStyle={fallbackStyle} />
		}
		if (format) {
			return <>{format(booleanField.value)}</>
		}
		switch (booleanStyle) {
			case 'checkCross':
				return <>{booleanField.value ? '✔' : '✗'}</>
			case 'oneZero':
				return <>{booleanField.value ? '1' : '0'}</>
			case 'yesNo':
			default:
				return (
					<>{booleanField.value ? formatMessage('fieldView.boolean.yes') : formatMessage('fieldView.boolean.no')}</>
				)
		}
	},
	props => (
		<>
			<SugaredField field={props.field} />
			<FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
		</>
	),
	'DateFieldView',
)
