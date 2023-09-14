import { Component } from '@contember/react-binding'
import type { FunctionComponent, ReactNode } from 'react'
import type { SugaredDiscriminateBy } from '../discrimination'

export interface BlockProps {
	/**
	 * Field to discriminate by.
	 */
	discriminateBy: SugaredDiscriminateBy
	label?: ReactNode
	description?: ReactNode
	alternate?: ReactNode
	children?: ReactNode
}

/**
 * The Block component is used for wrapping fields in {@link BlockRepeater}, {@link BlockEditor} or {@link DiscriminatedBlocks} components.
 *
 * @example
 * ```
 * <Block discriminateBy="gallery" label="Gallery" />
 * ```

 * @group Blocks and repeaters
 */
export const Block: FunctionComponent<BlockProps> = Component(
	props => <>{props.children}</>,
	props => (
		<>
			{props.alternate}
			{props.children}
		</>
	),
	'Block',
)
