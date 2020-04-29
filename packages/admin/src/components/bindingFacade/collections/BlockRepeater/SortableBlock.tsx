import { SugaredRelativeSingleField, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../blocks'
import { RepeaterItem, RepeaterItemProps } from '../Repeater'

export interface SortableBlockOwnProps {
	discriminationField: string | SugaredRelativeSingleField
	normalizedBlocks: NormalizedBlocks
}

export interface SortableBlockProps extends RepeaterItemProps, SortableBlockOwnProps {}

export const SortableBlock = React.memo<SortableBlockProps>(props => {
	const field = useRelativeSingleField(props.discriminationField)
	const selectedBlock = getDiscriminatedBlock(props.normalizedBlocks, field)

	if (!selectedBlock) {
		return null
	}

	return (
		<RepeaterItem {...props} label={selectedBlock.data.label}>
			{selectedBlock.data.children}
		</RepeaterItem>
	)
})
SortableBlock.displayName = 'SortableBlock'
