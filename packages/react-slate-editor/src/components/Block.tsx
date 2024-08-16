import { Component } from '@contember/react-binding'
import type { FunctionComponent, ReactNode } from 'react'
import { RenderElementProps } from 'slate-react'

export type BlockRendererProps =
	& RenderElementProps
	& {
		isVoid: boolean
	}

export interface BlockProps {
	name: string
	render: ({}: BlockRendererProps) => ReactNode
	children?: ReactNode
}

/**
 * The Block component is used for wrapping fields in {@link BlockEditor} component.
 * @group Blocks and repeaters
 */
export const Block: FunctionComponent<BlockProps> = Component(
	props => null,
	props => (
		<>
			{props.children}
		</>
	),
	'Block',
)
