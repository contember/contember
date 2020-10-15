import { EditorBlockBoundary } from '@contember/ui'
import * as React from 'react'
import { ReactEditor, RenderElementProps, useEditor } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import { EditorWithEssentials } from './EditorWithEssentials'
import { EditorNode } from './Node'

export interface BlockElementProps extends RenderElementProps {
	domElement?: keyof JSX.IntrinsicElements
	withBoundaries?: boolean
}

export const BlockElement = React.memo(function BlockElement({
	element,
	children,
	attributes,
	domElement = 'div',
	withBoundaries = false,
}: BlockElementProps) {
	const editor = useEditor() as EditorWithEssentials<EditorNode>
	const elementPath = ReactEditor.findPath(editor, element)
	const dataAttributes = ContemberEditor.getElementDataAttributes(element)

	return React.createElement(
		domElement,
		{
			...dataAttributes,
			...attributes,
		},
		[
			<React.Fragment key="before">
				{withBoundaries && (
					<EditorBlockBoundary
						blockEdge="before"
						onClick={() => editor.insertBetweenBlocks([element, elementPath], 'before')}
					/>
				)}
			</React.Fragment>,
			<React.Fragment key="block">{children}</React.Fragment>,
			<React.Fragment key="after">
				{withBoundaries && (
					<EditorBlockBoundary
						blockEdge="after"
						onClick={() => editor.insertBetweenBlocks([element, elementPath], 'after')}
					/>
				)}
			</React.Fragment>,
		],
	)
})
