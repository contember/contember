import { FieldFallbackView, FieldFallbackViewPublicProps } from '../../../../fieldViews'
import { Component, Field } from '@contember/react-binding'
import { createNumberCell, NumberCellRendererProps } from '../../cells'
import { ReactNode } from 'react'
import { DataGridColumnPublicProps } from '../types'
import { NumberCellFilter, NumberCellFilterExtraProps } from '../filters'

export type NumberCellValueRendererProps =
	& NumberCellRendererProps
	& FieldFallbackViewPublicProps
	& {
		format?: (value: number | null) => ReactNode
	}

/**
 * DataGrid cell for displaying a content of number field.
 *
 * @example
 * ```
 * <NumberCell field="viewCount" header="View count" />
 * ```
 *
 * @group Data grid
 */
export const NumberCell = createNumberCell<DataGridColumnPublicProps, NumberCellValueRendererProps, NumberCellFilterExtraProps>({
	FilterRenderer: NumberCellFilter,
	ValueRenderer: Component<NumberCellValueRendererProps>(props => {
		return <Field<string>
			{...props}
			format={value => {
				if (value === null) {
					return <FieldFallbackView fallback={props.fallback} fallbackStyle={props.fallbackStyle} />
				}
				if (props.format) {
					return props.format(value as any)
				}
				return value
			}}
		/>
	}),
})


