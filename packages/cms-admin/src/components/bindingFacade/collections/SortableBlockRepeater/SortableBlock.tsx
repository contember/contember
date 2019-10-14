import { Box } from '@contember/ui'
import * as React from 'react'
import { RelativeSingleField } from '../../../../binding/bindingTypes'
import { Field } from '../../../../binding/coreComponents'
import { DataBindingError, EntityAccessor, FieldAccessor } from '../../../../binding/dao'
import { NormalizedBlockProps } from '../../ui/blocks'

export interface SortableBlockProps {
	discriminationField: RelativeSingleField
	normalizedBlockProps: NormalizedBlockProps[]
}

export const SortableBlock = React.memo<SortableBlockProps>(props => (
	<Field.DataRetriever name={props.discriminationField}>
		{rawMetadata => {
			const data = rawMetadata.data

			if (!(data instanceof EntityAccessor)) {
				throw new DataBindingError(`Corrupt data`)
			}
			const field = data.data.getField(props.discriminationField)

			if (!(field instanceof FieldAccessor)) {
				throw new DataBindingError(`Corrupt data`)
			}

			const selectedBlock = props.normalizedBlockProps.find(block => field.hasValue(block.discriminateBy))

			if (!selectedBlock) {
				return null
			}

			return (
				<Box heading={selectedBlock.label} distinction="seamlessIfNested">
					{selectedBlock.children}
				</Box>
			)
		}}
	</Field.DataRetriever>
))
SortableBlock.displayName = 'SortableBlock'
