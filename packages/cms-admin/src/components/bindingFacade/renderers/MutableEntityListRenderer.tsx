import { Box } from '@contember/ui'
import * as React from 'react'
import { Component } from '../../../binding'
import { AddNewButton } from '../buttons'
import { Repeater, Sortable, SortablePublicProps } from '../collections'
import {
	EntityListWrapperProps,
	ImmutableEntityListRenderer,
	ImmutableEntityListRendererProps,
} from './ImmutableEntityListRenderer'

// TODO properly unify with repeaters
export interface MutableEntityListRendererProps extends ImmutableEntityListRendererProps {
	sortable?: Omit<SortablePublicProps, 'children'> // TODO this contains props that we don't want to set from here
	enableAddingNew?: boolean
	enableRemove?: boolean
}

export const MutableEntityListRenderer = Component<MutableEntityListRendererProps>(
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
		const fallbackWrapper: React.ComponentType<EntityListWrapperProps> = React.useCallback(
			(props: EntityListWrapperProps) => (
				<Box>
					{props.children}
					{enableAddingNew && !sortable && <AddNewButton addNew={props.accessor.addNew} />}
				</Box>
			),
			[enableAddingNew, sortable],
		)
		const Wrapper = wrapperComponent || fallbackWrapper
		const normalizedWrapper = React.useCallback(
			(props: EntityListWrapperProps) => (
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

			<ImmutableEntityListRenderer
				beforeContent={beforeContent}
				afterContent={afterContent}
				emptyMessage={emptyMessage}
				wrapperComponent={normalizedWrapper}
			>
				{children}
			</ImmutableEntityListRenderer>
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
		<ImmutableEntityListRenderer beforeContent={beforeContent} afterContent={afterContent} emptyMessage={emptyMessage}>
			{sortable && <Sortable {...sortable}>{children}</Sortable>}
			{sortable || children}
		</ImmutableEntityListRenderer>
	),
	'MutableEntityListRenderer',
)
