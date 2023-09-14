import { Component, Entity, EntityAccessor, EntityListAccessor } from '@contember/react-binding'
import { Table, TableCell, TableProps, TableRow, TableRowProps } from '@contember/ui'
import { ReactElement, ReactNode, memo } from 'react'
import { DeleteEntityButton, EmptyMessage, EmptyMessageOuterProps } from '../../collections'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'

export type ImmutableEntityListTablePageRendererProps<ContainerExtraProps, ItemExtraProps> =
	& LayoutRendererProps
	& EmptyMessageOuterProps
	& {
		accessor: EntityListAccessor
		tableProps?: Omit<TableProps, 'children'>
		tableRowProps?: Omit<TableRowProps, 'children'>
		enableRemoving?: boolean
	}

export const ImmutableEntityListTablePageRenderer = Component(
	<ContainerExtraProps, ItemExtraProps>({
		enableRemoving = true,
		children,
		tableProps,
		tableRowProps,
		accessor,
		emptyMessage,
		emptyMessageComponent,
		afterTitle,
		...layoutProps
	}: ImmutableEntityListTablePageRendererProps<ContainerExtraProps, ItemExtraProps>) => {
		return (
			<LayoutRenderer
				{...layoutProps}
			>
				<TableRenderer accessor={accessor} {...{ emptyMessage, emptyMessageComponent }} {...tableProps} >
					<TableRowRenderer {...tableRowProps} enableRemoving={enableRemoving}>{children}</TableRowRenderer>
				</TableRenderer>
			</LayoutRenderer>
		)
	},
	'ImmutableEntityListTablePageRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: ImmutableEntityListTablePageRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement


export type TableContainerRendererProps =
	& TableProps
	& EmptyMessageOuterProps
	& {
		accessor: EntityListAccessor
		children: ReactNode
	}
export const TableRenderer = Component(
	({ accessor, children, ...props }: TableContainerRendererProps) => {
		// TODO solve this via preferences
		const isEmpty = !Array.from(accessor).some(entity => entity instanceof EntityAccessor && entity.existsOnServer)

		if (isEmpty) {
			return (
				<EmptyMessage component={props.emptyMessageComponent}>{props.emptyMessage ?? 'There are no items to display.'}</EmptyMessage>
			)
		}

		return (
			<Table {...props} >
				{Array.from(accessor).map((it, i) => (
					<Entity key={i} accessor={it}>
						{children}
					</Entity>
				))}
			</Table>
		)
	},
	({ children }) => <>{children}</>,
	'TableContainerRenderer',
)

type TableRowRendererProps =
	& TableRowProps
	& {
		enableRemoving: boolean
		children: ReactNode
	}

const TableRowRenderer = memo((props: TableRowRendererProps) => (
	<TableRow {...props}>
		{props.children}
		{props.enableRemoving && (
			<TableCell shrunk>
				<DeleteEntityButton immediatePersist={true} />
			</TableCell>
		)}
	</TableRow>
))
TableRow.displayName = 'TableRowRenderer'
