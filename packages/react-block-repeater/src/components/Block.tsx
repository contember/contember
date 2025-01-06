import { BindingError, Component } from '@contember/react-binding'
import { ReactNode } from 'react'

/**
 * Props for the {@link Block} component.
 */
export interface BlockProps {
	/**
	 * The content of the block.
	 */
	children: ReactNode
	/**
	 * Identifier of the block.
	 */
	name: string
	/**
	 * Optional label for the block.
	 */
	label?: ReactNode
	/**
	 * Optional form for the block.
	 */
	form?: ReactNode
}

/**
 * Represents individual blocks within a block repeater.
 *
 * ## Props {@link BlockProps}
 * - name, children, ?label, ?form
 *
 * ## Example
 * ```tsx
 * <Block name="text" label="Text">
 *     <Field field="content" />
 * </Block>
 * ```
 */
export const Block = Component<BlockProps>(props => {
	throw new BindingError('"Block" component is not supposed to be rendered.')
}, ({ label, children, form }) => {
	return <>
		{label}
		{children}
		{form}
	</>
})
