import { FieldSet } from '@contember/ui'
import * as React from 'react'
import { MutationStateContext } from '../../../coreComponents'
import { EntityCollectionAccessor } from '../../../dao'
import { NormalizedBlockProps } from '../../ui/blocks'
import { useNormalizedBlockList } from '../../ui/blocks/useNormalizedBlockList'
import { Sortable } from '../Sortable'
import { AddNewBlockButton } from './AddNewBlockButton'
import { SortableBlock } from './SortableBlock'
import { SortableBlockRepeaterProps } from './SortableBlockRepeater'

export type SortableBlockRepeaterInnerProps = SortableBlockRepeaterProps & {
	shouldViewContent: boolean
	collectionAccessor: EntityCollectionAccessor
}

export const SortableBlockRepeaterInner = React.memo((props: SortableBlockRepeaterInnerProps) => {
	const isMutating = React.useContext(MutationStateContext)
	const normalizedBlockList: NormalizedBlockProps[] = useNormalizedBlockList(props.children)
	const blockChildren = React.useMemo(
		// This is to avoid unnecessary re-renders
		() => <SortableBlock normalizedBlockProps={normalizedBlockList} discriminationField={props.discriminationField} />,
		[normalizedBlockList, props.discriminationField],
	)

	return (
		// Intentionally not applying label system middleware
		<FieldSet legend={props.label} errors={props.collectionAccessor.errors}>
			<div className="cloneable">
				{props.shouldViewContent && (
					<div className="cloneable-content">
						<Sortable
							entities={props.collectionAccessor}
							sortBy={props.sortBy}
							label={props.label}
							enableAddingNew={false}
							enableUnlink={props.enableUnlink}
							enableUnlinkAll={props.enableUnlinkAll}
							removeType={props.removeType}
						>
							{blockChildren}
						</Sortable>
					</div>
				)}
				{props.shouldViewContent || (
					<div className="cloneable-emptyMessage">
						{props.emptyMessage || 'There is no content yet. Try adding a new block.'}
					</div>
				)}
				{props.collectionAccessor.addNew && (
					<AddNewBlockButton
						addNew={props.collectionAccessor.addNew}
						normalizedBlockProps={normalizedBlockList}
						isMutating={isMutating}
						discriminationField={props.discriminationField}
					/>
				)}
			</div>
		</FieldSet>
	)
})
SortableBlockRepeaterInner.displayName = 'SortableBlockRepeaterInner'
