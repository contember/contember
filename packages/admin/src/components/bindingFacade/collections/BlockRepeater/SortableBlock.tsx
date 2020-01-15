import * as React from 'react'
import { SugaredRelativeSingleField, useRelativeSingleField } from '@contember/binding'
import { NormalizedBlockProps } from '../../blocks'
import { RepeaterItem, RepeaterItemProps } from '../Repeater'

export interface SortableBlockProps extends RepeaterItemProps {
	discriminationField: string | SugaredRelativeSingleField
	normalizedBlockProps: NormalizedBlockProps[]
}

export const SortableBlock = React.memo<SortableBlockProps>(props => {
	const field = useRelativeSingleField(props.discriminationField)
	const selectedBlock = React.useMemo(
		() => props.normalizedBlockProps.find(block => field.hasValue(block.discriminateBy)),
		[field, props.normalizedBlockProps],
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
