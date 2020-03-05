import { SugaredRelativeSingleField, useRelativeSingleField } from '@contember/binding'
import * as React from 'react'
import { NormalizedBlock } from '../../blocks'
import { RepeaterItem, RepeaterItemProps } from '../Repeater'

export interface SortableBlockOwnProps {
	discriminationField: string | SugaredRelativeSingleField
	normalizedBlocks: NormalizedBlock[]
}

export interface SortableBlockProps extends RepeaterItemProps, SortableBlockOwnProps {}

export const SortableBlock = React.memo<SortableBlockProps>(props => {
	const field = useRelativeSingleField(props.discriminationField)
	const selectedBlock = React.useMemo(
		() => props.normalizedBlocks.find(block => field.hasValue(block.discriminateBy)),
		[field, props.normalizedBlocks],
	)

	if (!selectedBlock) {
		return null
	}

	return (
		<RepeaterItem {...props} label={selectedBlock.label}>
			{selectedBlock.children}
		</RepeaterItem>
	)
})
SortableBlock.displayName = 'SortableBlock'
