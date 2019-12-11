import * as React from 'react'
import { Component, SugaredRelativeSingleField, useMutationState } from '../../../../binding'
import { DiscriminatedBlocks, NormalizedBlockProps } from '../../blocks'
import { useNormalizedBlockList } from '../../blocks/useNormalizedBlockList'
import { AddNewEntityButtonProps } from '../helpers'
import { Repeater, RepeaterProps } from '../Repeater'
import { AddNewBlockButton } from './AddNewBlockButton'
import { SortableBlock } from './SortableBlock'

export interface BlockRepeaterProps extends RepeaterProps {
	discriminationField: string | SugaredRelativeSingleField
}

export const BlockRepeater = Component<BlockRepeaterProps>(
	({ discriminationField, ...props }) => {
		const isMutating = useMutationState()
		const normalizedBlockList: NormalizedBlockProps[] = useNormalizedBlockList(props.children)
		const blockChildren = React.useMemo(
			// This is to avoid unnecessary re-renders
			() => <SortableBlock normalizedBlockProps={normalizedBlockList} discriminationField={discriminationField} />,
			[normalizedBlockList, discriminationField],
		)
		const addButton = React.useCallback(
			(props: AddNewEntityButtonProps) => (
				<AddNewBlockButton
					addNew={props.addNew}
					normalizedBlockProps={normalizedBlockList}
					isMutating={isMutating}
					discriminationField={discriminationField}
				/>
			),
			[discriminationField, isMutating, normalizedBlockList],
		)

		return (
			<Repeater {...props} addButtonComponent={addButton}>
				{blockChildren}
			</Repeater>
		)
	},
	props => (
		<Repeater {...props} initialRowCount={0}>
			{typeof props.discriminationField === 'string' && (
				<DiscriminatedBlocks field={props.discriminationField} label={props.label}>
					{props.children}
				</DiscriminatedBlocks>
			)}
			{typeof props.discriminationField === 'string' || (
				<DiscriminatedBlocks {...props.discriminationField} label={props.label}>
					{props.children}
				</DiscriminatedBlocks>
			)}
		</Repeater>
	),
	'SortableBlockRepeater',
)
