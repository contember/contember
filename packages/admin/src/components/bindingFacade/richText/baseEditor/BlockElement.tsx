import { EditorBlockBoundary } from '@contember/ui'
import { memo } from 'react'
import { ReactEditor, RenderElementProps, useSlateStatic } from 'slate-react'
import { useMessageFormatter } from '../../../../i18n'
import { ContemberEditor } from '../ContemberEditor'
import { editorDictionary } from './editorDictionary'

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
	const El = domElement as 'div'
	const formatter = useMessageFormatter(editorDictionary)

	return (
		<El {...dataAttributes} {...attributes}>
			{withBoundaries && (
				<EditorBlockBoundary
					blockEdge="before"
					newParagraphText={formatter('editorBlock.editorBlockBoundary.newParagraph')}
					onClick={() => {
						const elementPath = ReactEditor.findPath(editor, element)
						editor.insertBetweenBlocks([element, elementPath], 'before')
					}}
				/>
			)}
			{children}
			{withBoundaries && (
				<EditorBlockBoundary
					blockEdge="after"
					newParagraphText={formatter('editorBlock.editorBlockBoundary.newParagraph')}
					onClick={() => {
						const elementPath = ReactEditor.findPath(editor, element)
						editor.insertBetweenBlocks([element, elementPath], 'after')
					}}
				/>
			)}
		</El>
	)
})
