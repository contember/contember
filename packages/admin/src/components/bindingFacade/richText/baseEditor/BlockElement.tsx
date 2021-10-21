import { EditorBlockBoundary } from '@contember/ui'
import { createElement, Fragment, memo } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from 'slate-react'
import { ContemberEditor } from '../ContemberEditor'

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
	const editor = useSlateStatic()
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
