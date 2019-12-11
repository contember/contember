import { Table, TableCell, TableProps, TableRow, TableRowProps } from '@contember/ui'
import * as React from 'react'
import { Component } from '../../../binding'
import { RemoveEntityButton } from '../collections/helpers'
import { RepeaterContainerProps, RepeaterItemProps } from '../collections/Repeater'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import { ImmutableEntityListRenderer, ImmutableEntityListRendererProps } from './ImmutableEntityListRenderer'

export interface TableRendererProps
	extends ImmutableContentLayoutRendererProps,
		Omit<ImmutableEntityListRendererProps, 'wrapperComponent'> {
	tableProps?: Omit<TableProps, 'children'>
	tableRowProps?: Omit<TableRowProps, 'children'>
	enableRemove?: boolean
}

export const TableRenderer = Component<TableRendererProps>(
	({
		enableRemove = true,
		children,
		side,
		title,
		navigation,
		headingProps,
		actions,
		tableProps,
		tableRowProps,
		...entityListProps
	}) => {
		return (
			<ImmutableContentLayoutRenderer
				side={side}
				title={title}
				navigation={navigation}
				actions={actions}
				headingProps={headingProps}
			>
				<ImmutableEntityListRenderer
					{...entityListProps}
					containerComponent={Container}
					containerComponentExtraProps={tableProps}
					itemComponent={Row}
					itemComponentExtraProps={tableRowProps}
				>
					{children}
				</ImmutableEntityListRenderer>
			</ImmutableContentLayoutRenderer>
		)
	},
	'TableRenderer',
)

const Container = React.memo((props: RepeaterContainerProps & Omit<TableProps, 'children'>) => (
	<Table {...props} />
))
Container.displayName = 'Container'

const Row = React.memo((props: RepeaterItemProps & Omit<TableRowProps, 'children'> & { enableRemove?: boolean }) => (
	<TableRow {...props}>
		{props.children}
		{props.enableRemove !== false && (
			<TableCell shrunk>
				<RemoveEntityButton removalType="delete" immediatePersist={true} />
			</TableCell>
		)}
	</TableRow>
))
Row.displayName = 'Row'
