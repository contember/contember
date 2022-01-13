import { Component, Entity, EntityAccessor, EntityListAccessor } from '@contember/binding'
import { Table, TableCell, TableProps, TableRow, TableRowProps } from '@contember/ui'
import { ComponentType, memo, ReactElement, ReactNode } from 'react'
import { DeleteEntityButton, EmptyMessage, EmptyMessageProps } from '../../collections'
import { LayoutRenderer, LayoutRendererProps } from '../LayoutRenderer'

interface EmptyMessageOuterProps {
	emptyMessage?: ReactNode
	emptyMessageComponent?: ComponentType<EmptyMessageProps & any> // This can override 'emptyMessage'
	emptyMessageComponentExtraProps?: {}
}

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
		emptyMessageComponentExtraProps,
		after,
		...layoutProps
	}: ImmutableEntityListTablePageRendererProps<ContainerExtraProps, ItemExtraProps>) => {
		return (
			<LayoutRenderer
				{...layoutProps}
			>
				<TableRenderer accessor={accessor} {...{ emptyMessage, emptyMessageComponent, emptyMessageComponentExtraProps }} {...tableProps} >
					<TableRowRenderer {...tableRowProps} enableRemoving={enableRemoving}>{children}</TableRowRenderer>
				</TableRenderer>
			</LayoutRenderer>
		)
	},
	'ImmutableEntityListTablePageRenderer',
) as <ContainerExtraProps, ItemExtraProps>(
	props: ImmutableEntityListTablePageRendererProps<ContainerExtraProps, ItemExtraProps>,
) => ReactElement


type TableContainerRendererProps =
	& TableProps
	& EmptyMessageOuterProps
	& {
		accessor: EntityListAccessor
		children: ReactNode
	}
const TableRenderer = Component(
	({ accessor, children, ...props }: TableContainerRendererProps) => {
		// TODO solve this via preferences
		const isEmpty = !Array.from(accessor).some(entity => entity instanceof EntityAccessor && entity.existsOnServer)

		if (isEmpty) {
			const EmptyMessageComponent = props.emptyMessageComponent || EmptyTable
			return (
				<EmptyMessageComponent {...props.emptyMessageComponentExtraProps}>
					{props.emptyMessage || 'There are no items to display.'}
				</EmptyMessageComponent>
			)
		}

		return (
			<Table {...props} >
				{Array.from(accessor).map(it => (
					<Entity accessor={it}>
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


const EmptyTable = memo((props: { children: ReactNode }) => (
	<EmptyMessage>{props.children}</EmptyMessage>
))
EmptyTable.displayName = 'EmptyTable'
