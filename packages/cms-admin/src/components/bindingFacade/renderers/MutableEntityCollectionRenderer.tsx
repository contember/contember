import { Box } from '@contember/ui'
import * as React from 'react'
import { Component } from '../../../binding'
import { AddNewButton } from '../buttons'
import { Repeater, Sortable, SortablePublicProps } from '../collections'
import {
	EntityCollectionWrapperProps,
	ImmutableEntityCollectionRenderer,
	ImmutableEntityCollectionRendererProps,
} from './ImmutableEntityCollectionRenderer'

// TODO properly unify with repeaters
export interface MutableEntityCollectionRendererProps extends ImmutableEntityCollectionRendererProps {
	sortable?: Omit<SortablePublicProps, 'children'> // TODO this contains props that we don't want to set from here
	enableAddingNew?: boolean
	enableRemove?: boolean
}

export const MutableEntityCollectionRenderer = Component<MutableEntityCollectionRendererProps>(
	({
		sortable,
		enableAddingNew = true,
		enableRemove = true,
		wrapperComponent,
		children,

		beforeContent,
		afterContent,
		emptyMessage,
	}) => {
		const fallbackWrapper: React.ComponentType<EntityCollectionWrapperProps> = React.useCallback(
			(props: EntityCollectionWrapperProps) => (
				<Box>
					{props.children}
					{enableAddingNew && !sortable && <AddNewButton addNew={props.accessor.addNew} />}
				</Box>
			),
			[enableAddingNew, sortable],
		)
		const Wrapper = wrapperComponent || fallbackWrapper
		const normalizedWrapper = React.useCallback(
			(props: EntityCollectionWrapperProps) => (
				<Wrapper {...props}>
					{sortable ? (
						// Deliberately not using props.children
						<Sortable {...sortable} entities={props.accessor} enableAddingNew={enableAddingNew}>
							{children}
						</Sortable>
					) : (
						<Repeater.Cloneable enableAddingNew={enableAddingNew}>
							{props.accessor.entities.map(
								entity =>
									!!entity && ( // TODO this is temporary
										<Box key={entity.getKey()}>
											<Repeater.Item displayUnlinkButton={enableRemove} entity={entity} removeType="delete">
												{children}
											</Repeater.Item>
										</Box>
									),
							)}
						</Repeater.Cloneable>
					)}
				</Wrapper>
			),
			[children, enableAddingNew, enableRemove, sortable],
		)

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
