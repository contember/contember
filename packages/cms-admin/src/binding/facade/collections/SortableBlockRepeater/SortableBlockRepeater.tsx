import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { useRelativeEntityList } from '../../../accessorRetrievers'
import { useMutationState } from '../../../accessorTree'
import { RelativeSingleField } from '../../../bindingTypes'
import { ToMany } from '../../../coreComponents'
import { Component } from '../../../coreComponents/Component'
import { DiscriminatedBlocks, NormalizedBlockProps } from '../../ui/blocks'
import { useNormalizedBlockList } from '../../ui/blocks/useNormalizedBlockList'
import { Sortable } from '../Sortable'
import { SortableRepeaterProps } from '../SortableRepeater'
import { AddNewBlockButton } from './AddNewBlockButton'
import { SortableBlock } from './SortableBlock'

export interface SortableBlockRepeaterProps extends SortableRepeaterProps {
	discriminationField: RelativeSingleField
	children: React.ReactNode
}

export const SortableBlockRepeater = Component<SortableBlockRepeaterProps>(
	props => {
		const collectionAccessor = useRelativeEntityList(props.field)
		const isMutating = useMutationState()
		const normalizedBlockList: NormalizedBlockProps[] = useNormalizedBlockList(props.children)
		const blockChildren = React.useMemo(
			// This is to avoid unnecessary re-renders
			() => (
				<SortableBlock normalizedBlockProps={normalizedBlockList} discriminationField={props.discriminationField} />
			),
			[normalizedBlockList, props.discriminationField],
		)

		return (
			// Intentionally not applying label system middleware
			<FieldSet legend={props.label} errors={collectionAccessor.errors}>
				<div className="cloneable">
					<div className="cloneable-content">
						<Sortable
							entities={collectionAccessor}
							sortBy={props.sortBy}
							label={props.label}
							enableAddingNew={false}
							enableUnlink={props.enableUnlink}
							enableUnlinkAll={props.enableUnlinkAll}
							removeType={props.removeType}
							emptyMessage={props.emptyMessage}
						>
							{blockChildren}
						</Sortable>
					</div>
					{collectionAccessor.addNew && (
						<AddNewBlockButton
							addNew={collectionAccessor.addNew}
							normalizedBlockProps={normalizedBlockList}
							isMutating={isMutating}
							discriminationField={props.discriminationField}
						/>
					)}
				</div>
			</FieldSet>
		)
	},
	props => (
		<ToMany
			field={props.field}
			preferences={{
				initialEntityCount: 0,
			}}
		>
			<Sortable sortBy={props.sortBy}>
				<DiscriminatedBlocks name={props.discriminationField} label={props.label}>
					{props.children}
				</DiscriminatedBlocks>
			</Sortable>
		</ToMany>
	),
	'SortableBlockRepeater',
)
