import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { Component, RelativeSingleField, ToMany, useMutationState, useRelativeEntityList } from '../../../../binding'
import { DiscriminatedBlocks, NormalizedBlockProps } from '../../blocks'
import { useNormalizedBlockList } from '../../blocks/useNormalizedBlockList'
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
		const listAccessor = useRelativeEntityList(props.field)
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
			<FieldSet legend={props.label} errors={listAccessor.errors}>
				<div className="cloneable">
					<div className="cloneable-content">
						<Sortable
							entities={listAccessor}
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
					{listAccessor.addNew && (
						<AddNewBlockButton
							addNew={listAccessor.addNew}
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
