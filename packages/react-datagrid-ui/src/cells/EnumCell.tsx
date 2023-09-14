import { createEnumCell, EnumCellRendererProps } from '@contember/react-datagrid'
import { FieldFallbackView, FieldFallbackViewPublicProps } from '@contember/react-binding-ui'
import { DataGridColumnPublicProps } from '../types'
import { Component, Field } from '@contember/react-binding'
import { EnumCellFilter, EnumCellFilterExtraProps } from '../filters'
import { ReactNode } from 'react'

export type EnumCellValueRendererProps =
	& EnumCellRendererProps
	& FieldFallbackViewPublicProps
	& {
		format?: (value: string | null) => ReactNode
	}
/**
 * DataGrid cells for enums fields.
 *
 * @example
 * ```
 * <EnumCell
 * 	field={'state'}
 * 	options={{
 * 		draft: 'Draft',
 * 		published: 'Published',
 * 		removed: 'Removed',
 * 	}}
 * 	header={'State'}
 * />
 * ```
 *
 * @group Data grid
 */
export const EnumCell = createEnumCell<DataGridColumnPublicProps, EnumCellValueRendererProps, EnumCellFilterExtraProps>({
	FilterRenderer: EnumCellFilter,
	ValueRenderer: Component<EnumCellValueRendererProps>(props => {
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


