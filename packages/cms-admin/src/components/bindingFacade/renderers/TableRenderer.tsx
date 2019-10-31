import { Table, TableCell, TableProps, TableRow, TableRowProps } from '@contember/ui'
import * as React from 'react'
import { AccessorContext, Component, EntityAccessor } from '../../../binding'
import { RemoveButton } from '../buttons'
import { ImmutableContentLayoutRenderer, ImmutableContentLayoutRendererProps } from './ImmutableContentLayoutRenderer'
import {
	EntityCollectionWrapperProps,
	ImmutableEntityCollectionRenderer,
	ImmutableEntityCollectionRendererProps,
} from './ImmutableEntityCollectionRenderer'

export interface TableRendererProps
	extends ImmutableContentLayoutRendererProps,
		Omit<ImmutableEntityCollectionRendererProps, 'wrapperComponent'> {
	tableProps?: Omit<TableProps, 'children'>
	tableRowProps?: Omit<TableRowProps, 'children'>
	enableRemove?: boolean
}

export const TableRenderer = Component<TableRendererProps>(
	({
		children,
		beforeContent,
		afterContent,
		emptyMessage,
		tableProps,
		tableRowProps,
		enableRemove = true,
		...layoutProps
	}) => {
		const TableWrapper: React.ComponentType<EntityCollectionWrapperProps> = props => {
			if (props.isEmpty) {
				return <>{props.children}</>
			}
			return (
				<Table {...tableProps}>
					{props.accessor.entities.map(entity =>
						// TODO this check is wrong but likely necessary for the time being
						entity instanceof EntityAccessor ? (
							<AccessorContext.Provider value={entity} key={entity.getKey()}>
								<TableRow {...tableRowProps}>
									{props.originalChildren}
									{enableRemove && (
										<TableCell shrunk>
											<RemoveButton removeType={'delete'} immediatePersist={true} />
										</TableCell>
									)}
								</TableRow>
							</AccessorContext.Provider>
						) : null,
					)}
				</Table>
			)
		}
		TableWrapper.displayName = 'TableWrapper'
		return (
			<ImmutableContentLayoutRenderer {...layoutProps}>
				<ImmutableEntityCollectionRenderer
					beforeContent={beforeContent}
					afterContent={afterContent}
					emptyMessage={emptyMessage}
					wrapperComponent={TableWrapper}
				>
					{children}
				</ImmutableEntityCollectionRenderer>
			</ImmutableContentLayoutRenderer>
		)
	},
	'TableRenderer',
)
