import * as React from 'react'
import { useRelativeEntityList } from '../../../accessorRetrievers'
import { RelativeSingleField } from '../../../bindingTypes'
import { MutationStateContext, ToMany } from '../../../coreComponents'
import { EntityAccessor, FieldAccessor } from '../../../dao'
import { Component } from '../../auxiliary'
import { DiscriminatedBlocks, NormalizedBlockProps } from '../../ui/blocks'
import { useNormalizedBlockList } from '../../ui/blocks/useNormalizedBlockList'
import { Sortable } from '../Sortable'
import { SortableRepeaterProps } from '../SortableRepeater'
import { SortableBlockRepeaterInner } from './SortableBlockRepeaterInner'

export interface SortableBlockRepeaterProps extends SortableRepeaterProps {
	discriminationField: RelativeSingleField
	children: React.ReactNode
	emptyMessage?: React.ReactNode
}

export const SortableBlockRepeater = Component<SortableBlockRepeaterProps>(
	props => {
		const collectionAccessor = useRelativeEntityList(props.field)

		const filteredEntities: EntityAccessor[] = collectionAccessor.entities.filter(
			(item): item is EntityAccessor => item instanceof EntityAccessor,
		)
		const firstEntity = filteredEntities[0]
		const firstDiscrimination = firstEntity.data.getField(props.discriminationField)

		if (!(firstDiscrimination instanceof FieldAccessor)) {
			return null
		}
		const firstDiscriminationNull = firstDiscrimination.currentValue === null

		const shouldViewContent = filteredEntities.length > 1 || !firstDiscriminationNull

		return (
			<SortableBlockRepeaterInner
				{...props}
				collectionAccessor={collectionAccessor}
				shouldViewContent={shouldViewContent}
			/>
		)
	},
	props => (
		<ToMany field={props.field}>
			<Sortable sortBy={props.sortBy}>
				<DiscriminatedBlocks name={props.discriminationField} label={props.label}>
					{props.children}
				</DiscriminatedBlocks>
			</Sortable>
		</ToMany>
	),
	'SortableBlockRepeater',
)
