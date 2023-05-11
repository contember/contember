import { SugaredRelativeSingleField, useField } from '@contember/binding'
import { memo } from 'react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../blocks'
import { RepeaterItem, RepeaterItemProps } from '../Repeater'

export interface SortableBlockOwnProps {
	discriminationField: string | SugaredRelativeSingleField
	normalizedBlocks: NormalizedBlocks
}

export interface SortableBlockProps extends RepeaterItemProps, SortableBlockOwnProps {}

/**
 * @internal
 */
export const SortableBlock = memo<SortableBlockProps>(props => {
	const field = useField(props.discriminationField)
	const selectedBlock = getDiscriminatedBlock(props.normalizedBlocks, field)

	if (!selectedBlock) {
		return null
	}

	return (
		<RepeaterItem {...props} label={selectedBlock.datum.label}>
			{selectedBlock.datum.children}
		</RepeaterItem>
	)
})
SortableBlock.displayName = 'SortableBlock'
