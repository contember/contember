import { Component, Field, SugaredRelativeSingleField } from '@contember/react-binding'
import { Repeater, RepeaterProps } from '@contember/react-repeater'
import { useState } from 'react'
import { extractBlocks } from '../internal/helpers/staticAnalyzer'
import { BlockRepeaterConfigContext } from '../contexts'

/**
 * Props for the {@link BlockRepeater} component.
 */
export type BlockRepeaterProps =
	& {
		/**
		 * A field that is used to determine the order of the entities.
		 */
		sortableBy: RepeaterProps['sortableBy']

		/**
		 * Discrimination field is a field that is used to determine which block should be rendered for a given entity.
		 */
		discriminationField: SugaredRelativeSingleField['field']
	}
	& RepeaterProps

/**
 * A repeater component that renders different blocks based on the value of a discrimination field.
 * This is headless component that does not impose any UI. Check DefaultBlockRepeater in UI library for a styled version.
 *
 * ## Props {@link BlockRepeaterProps}
 * - field or entities, sortableBy, discriminationField, children
 *
 * ## Example
 * ```tsx
 * <BlockRepeater field="blocks" discriminationField="type" sortableBy="order">
 *     <Block name="text" label="Text">
 *         <Field field="content" />
 *     </Block>
 *     <Block name="image" label="Image">
 *         <ImageField field="image" />
 *     </Block>
 * </BlockRepeater>
 * ```
 */
export const BlockRepeater = Component<BlockRepeaterProps>(({ children, ...props }, env) => {
	const [blocks] = useState(() => extractBlocks(children, env))
	if (Object.keys(blocks).length === 0) {
		throw new Error('BlockRepeater must have at least one Block child')
	}
	return (
		<Repeater {...props} initialEntityCount={0}>
			<BlockRepeaterConfigContext.Provider value={{ discriminatedBy: props.discriminationField, blocks }}>
				{children}
			</BlockRepeaterConfigContext.Provider>
		</Repeater>
	)
}, props => {
	return (
		<Repeater {...props}>
			{props.children}
			<Field field={props.discriminationField} />
		</Repeater>
	)
})
