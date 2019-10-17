import { Box } from '@contember/ui'
import * as React from 'react'
import { Component } from '../../../binding'
import { Sortable, SortablePublicProps } from '../collections'
import {
	ImmutableEntityCollectionRenderer,
	ImmutableEntityCollectionRendererProps,
	ImmutableEntityCollectionWrapperProps,
} from './ImmutableEntityCollectionRenderer'
import { MutableContentLayoutRenderer, MutableContentLayoutRendererProps } from './MutableContentLayoutRenderer'

export interface MutableEntityCollectionRendererProps
	extends Omit<ImmutableEntityCollectionRendererProps, 'wrapperComponent'>,
		MutableContentLayoutRendererProps {
	sortable?: Omit<SortablePublicProps, 'children'>
	enableAddingNew?: boolean
	enableRemove?: boolean
}

export const MutableEntityCollectionRenderer = Component<MutableEntityCollectionRendererProps>(
	({
		sortable,
		enableAddingNew,
		enableRemove, // TODO use this
		children,

		beforeContent,
		afterContent,
		emptyMessage,

		...layoutProps
	}) => {
		const SortableWrapper = React.useCallback(
			(props: ImmutableEntityCollectionWrapperProps) => (
				// ! because otherwise we won't use this entire component
				// Deliberately not using props.children
				<Box>
					<Sortable {...sortable!} entities={props.accessor}>
						{children}
					</Sortable>
				</Box>
			),
			[children, sortable],
		)

		// TODO enableAddingNew

		return (
			// TODO maybe use Repeater.Item?
			<MutableContentLayoutRenderer {...layoutProps}>
				<ImmutableEntityCollectionRenderer
					beforeContent={beforeContent}
					afterContent={afterContent}
					emptyMessage={emptyMessage}
					wrapperComponent={sortable !== undefined ? SortableWrapper : undefined}
				>
					{children}
				</ImmutableEntityCollectionRenderer>
			</MutableContentLayoutRenderer>
		)
	},
	({
		sortable,
		enableAddingNew,
		enableRemove,
		children,

		beforeContent,
		afterContent,
		emptyMessage,

		...layoutProps
	}) => (
		<MutableContentLayoutRenderer {...layoutProps}>
			<ImmutableEntityCollectionRenderer
				beforeContent={beforeContent}
				afterContent={afterContent}
				emptyMessage={emptyMessage}
			>
				{sortable && <Sortable {...sortable}>{children}</Sortable>}
				{sortable || children}
			</ImmutableEntityCollectionRenderer>
		</MutableContentLayoutRenderer>
	),
	'MutableEntityCollectionRenderer',
)
