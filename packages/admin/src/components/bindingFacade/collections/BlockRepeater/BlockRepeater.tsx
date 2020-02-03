import { Component, SugaredRelativeSingleField, useMutationState } from '@contember/binding'
import * as React from 'react'
import { DiscriminatedBlocks, useNormalizedBlocks } from '../../blocks'
import { Repeater, RepeaterProps } from '../Repeater'
import { AddNewBlockButton } from './AddNewBlockButton'
import { SortableBlock } from './SortableBlock'

export interface BlockRepeaterProps extends RepeaterProps {
	discriminationField: string | SugaredRelativeSingleField
}

export const BlockRepeater = Component<BlockRepeaterProps>(
	({ discriminationField, ...props }) => {
		const isMutating = useMutationState()
		const normalizedBlocks = useNormalizedBlocks(props.children)

		const extraProps = {
			normalizedBlocks: normalizedBlocks,
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
