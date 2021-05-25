import { EditorBlockBoundary } from '@contember/ui'
import { memo, createElement, Fragment } from 'react'
import { ReactEditor, RenderElementProps, useEditor } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'
import type { EditorWithEssentials } from './EditorWithEssentials'
import type { EditorNode } from './Node'

export interface BlockElementProps extends RenderElementProps {
	domElement?: keyof JSX.IntrinsicElements
	withBoundaries?: boolean
}

export const BlockElement = memo(function BlockElement({
	element,
	children,
	attributes,
	domElement = 'div',
	withBoundaries = false,
}: BlockElementProps) {
	const editor = useEditor() as EditorWithEssentials<EditorNode>
	const dataAttributes = ContemberEditor.getElementDataAttributes(element)

	return createElement(
		domElement,
		{
			...dataAttributes,
			...attributes,
		},
		[
			<Fragment key="before">
				{withBoundaries && (
					<EditorBlockBoundary
						blockEdge="before"
						onClick={() => {
							const elementPath = ReactEditor.findPath(editor, element)
							editor.insertBetweenBlocks([element, elementPath], 'before')
						}}
					/>
				)}
			</Fragment>,
			<Fragment key="block">{children}</Fragment>,
			<Fragment key="after">
				{withBoundaries && (
					<EditorBlockBoundary
						blockEdge="after"
						onClick={() => {
							const elementPath = ReactEditor.findPath(editor, element)
							editor.insertBetweenBlocks([element, elementPath], 'after')
						}}
					/>
				)}
			</Fragment>,
		],
	)
})
