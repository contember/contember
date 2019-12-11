import { Box } from '@contember/ui'
import * as React from 'react'
import { SugaredRelativeSingleField, useRelativeSingleField } from '../../../../binding'
import { NormalizedBlockProps } from '../../blocks'

export interface SortableBlockProps {
	discriminationField: string | SugaredRelativeSingleField
	normalizedBlockProps: NormalizedBlockProps[]
}

export const SortableBlock = React.memo<SortableBlockProps>(props => {
	const field = useRelativeSingleField(props.discriminationField)
	const selectedBlock = props.normalizedBlockProps.find(block => field.hasValue(block.discriminateBy))

	if (!selectedBlock) {
		return null
	}

	return (
		<Box heading={selectedBlock.label} distinction="seamlessIfNested">
			{selectedBlock.children}
		</Box>
	)
})
SortableBlock.displayName = 'SortableBlock'
