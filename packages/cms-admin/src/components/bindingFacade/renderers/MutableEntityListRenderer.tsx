import { Box } from '@contember/ui'
import * as React from 'react'
import { Component, Entity } from '../../../binding'
import { AddNewEntityButton } from '../collections/helpers'
import {
	EntityListWrapperProps,
	ImmutableEntityListRenderer,
	ImmutableEntityListRendererProps,
} from './ImmutableEntityListRenderer'

// TODO properly unify with repeaters
export interface MutableEntityListRendererProps extends ImmutableEntityListRendererProps {
	//sortable?: Omit<SortablePublicProps, 'children'> // TODO this contains props that we don't want to set from here
	sortable?: any // TODO TOOODOOOO!!!!
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
					{enableAddingNew && !sortable && <AddNewEntityButton addNew={props.accessor.addNew} />}
				</Box>
			),
			[enableAddingNew, sortable],
		)
		const Wrapper = wrapperComponent || fallbackWrapper
		const normalizedWrapper = React.useCallback(
			(props: EntityListWrapperProps) => (
				<Wrapper {...props}>
					{props.accessor.entities.map(
						entity =>
							!!entity && ( // TODO this is temporary
								<Box key={entity.getKey()}>
									<Entity accessor={entity}>{children}</Entity>
								</Box>
							),
					)}
				</Wrapper>
			),
			[children],
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
			{children}
		</ImmutableEntityListRenderer>
	),
	'MutableEntityListRenderer',
)
