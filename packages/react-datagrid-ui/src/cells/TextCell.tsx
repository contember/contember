import { FieldFallbackView, FieldFallbackViewPublicProps } from '@contember/react-binding-ui'
import { Component, Field } from '@contember/react-binding'
import { createTextCell, TextCellRendererProps } from '@contember/react-datagrid'
import { ReactNode } from 'react'
import { DataGridColumnPublicProps } from '../types'
import { TextCellFilter } from '../filters'

export type TextCellValueRendererProps =
	& TextCellRendererProps
	& FieldFallbackViewPublicProps
	& {
		format?: (value: string | null) => ReactNode
	}

/**
 * DataGrid cell for displaying a content of text field.
 *
 * @example
 * ```
 * <TextCell field="author.name" header="Author name" />
 * ```
 *
 * @group Data grid
 */
export const TextCell = createTextCell<DataGridColumnPublicProps, TextCellValueRendererProps>({
	FilterRenderer: TextCellFilter,
	ValueRenderer: Component<TextCellValueRendererProps>(props => {
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


