import { Component, SugaredFieldProps } from '@contember/react-binding'
import type { FunctionComponent } from 'react'
import { DiscriminatedBlocks, useNormalizedBlocks } from '../../blocks'
import { Repeater, RepeaterProps } from '../Repeater'
import { AddNewBlockButton } from './AddNewBlockButton'
import { SortableBlock } from './SortableBlock'

export type BlockRepeaterProps =
	& {
		discriminationField: SugaredFieldProps['field']
	}
	& Omit<
		RepeaterProps<unknown, unknown>,
		'containerComponent' | 'containerComponentExtraProps' | 'itemComponent' | 'itemComponentExtraProps'
	>

/**
 * The `BlockRepeater` component is a simple way to repeat blocks of content. Use {@link Block} for wrapping fields.
 *
 * @group Blocks and repeaters
 */
export const BlockRepeater: FunctionComponent<BlockRepeaterProps> = Component(
	({ discriminationField, ...props }) => {
		const normalizedBlocks = useNormalizedBlocks(props.children)

		const extraProps = {
			normalizedBlocks: normalizedBlocks,
			discriminationField,
		} as const

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
		<Repeater {...props} initialEntityCount={0}>
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
