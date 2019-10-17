import { Box } from '@contember/ui'
import * as React from 'react'
import { Component } from '../../../binding'
import { Sortable, SortablePublicProps } from '../collections'
import {
	ImmutableEntityCollectionRenderer,
	ImmutableEntityCollectionRendererProps,
	EntityCollectionWrapperProps,
} from './ImmutableEntityCollectionRenderer'

export interface MutableEntityCollectionRendererProps extends ImmutableEntityCollectionRendererProps {
	sortable?: Omit<SortablePublicProps, 'children'>
	enableAddingNew?: boolean
	enableRemove?: boolean
}

export const MutableEntityCollectionRenderer = Component<MutableEntityCollectionRendererProps>(
	({
		sortable,
		enableAddingNew,
		enableRemove, // TODO use this
		wrapperComponent,
		children,

		beforeContent,
		afterContent,
		emptyMessage,
	}) => {
		const normalizedWrapper = React.useCallback(
			(props: EntityCollectionWrapperProps) => {
				const Wrapper = wrapperComponent || Box

				return (
					<Wrapper {...props}>
						{sortable ? (
							// Deliberately not using props.children
							<Sortable {...sortable} entities={props.accessor}>
								{children}
							</Sortable>
						) : (
							props.children
						)}
					</Wrapper>
				)
			},
			[children, sortable, wrapperComponent],
		)

		// TODO enableAddingNew

		return (
			// TODO maybe use Repeater.Item?

			<ImmutableEntityCollectionRenderer
				beforeContent={beforeContent}
				afterContent={afterContent}
				emptyMessage={emptyMessage}
				wrapperComponent={normalizedWrapper}
			>
				{children}
			</ImmutableEntityCollectionRenderer>
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
	}) => (
		<ImmutableEntityCollectionRenderer
			beforeContent={beforeContent}
			afterContent={afterContent}
			emptyMessage={emptyMessage}
		>
			{sortable && <Sortable {...sortable}>{children}</Sortable>}
			{sortable || children}
		</ImmutableEntityCollectionRenderer>
	),
	'MutableEntityCollectionRenderer',
)
