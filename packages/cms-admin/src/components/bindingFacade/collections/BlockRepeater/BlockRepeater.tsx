import * as React from 'react'
import { Component, SugaredRelativeSingleField, useMutationState } from '../../../../binding'
import { DiscriminatedBlocks, NormalizedBlockProps } from '../../blocks'
import { useNormalizedBlockList } from '../../blocks/useNormalizedBlockList'
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

		const extraProps = {
			normalizedBlockProps: normalizedBlockList,
			isMutating,
			discriminationField,
		}

		return (
			<Repeater
				{...props}
				addButtonComponent={AddNewBlockButton}
				addButtonComponentExtraProps={extraProps}
				itemComponent={SortableBlock}
				itemComponentExtraProps={extraProps}
			>
				<></>
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
