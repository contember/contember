import { BindingError, RelativeSingleField, SingleEntity, useParentEntityAccessor } from '@contember/binding'
import { ActionableBox, Box, EditorBox } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { getDiscriminatedBlock } from '../../../blocks'
import { BlockElement } from '../../baseEditor'
import { BlockSlateEditor } from '../editor'
import { BlockVoidReferenceElement } from '../elements'
import { EditorReferenceBlocks } from '../templating'

export interface BlockVoidReferenceElementRendererProps extends RenderElementProps {
	element: BlockVoidReferenceElement
	referenceDiscriminationField: RelativeSingleField
	editorReferenceBlocks: EditorReferenceBlocks
}

export const BlockVoidReferenceElementRenderer = React.memo((props: BlockVoidReferenceElementRendererProps) => {
	const editor = useEditor() as BlockSlateEditor
	const selected = useSelected()

	const referencedEntity = useParentEntityAccessor()

	// TODO remove button, dragHandle, etc.
	const discriminationField = referencedEntity.getRelativeSingleField(props.referenceDiscriminationField)
	const discriminatedBlock = getDiscriminatedBlock(props.editorReferenceBlocks, discriminationField)
	const onContainerClick = React.useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (e.target === e.currentTarget) {
				const path = ReactEditor.findPath(editor, props.element)
				Transforms.select(editor, path)
			}
		},
		[editor, props.element],
	)
	const onRemove = React.useCallback(() => {
		const path = ReactEditor.findPath(editor, props.element)
		Transforms.removeNodes(editor, {
			at: path,
		})
	}, [editor, props.element])

	if (!discriminatedBlock) {
		throw new BindingError(`BlockEditor: Trying to render an entity with an undefined block type.`)
	}

	const selectedBlock = discriminatedBlock.datum
	const alternate = selectedBlock.alternate ? <Box>{selectedBlock.alternate}</Box> : undefined

	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			{/* https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245 */}
			<div contentEditable={false} data-slate-editor={false}>
				<SingleEntity accessor={referencedEntity}>
					<ActionableBox editContents={alternate} onRemove={onRemove}>
						<EditorBox heading={selectedBlock.label} isActive={selected} onClick={onContainerClick}>
							{selectedBlock.children}
						</EditorBox>
					</ActionableBox>
				</SingleEntity>
			</div>
			{props.children}
		</BlockElement>
	)
})
BlockVoidReferenceElementRenderer.displayName = 'BlockVoidReferenceElementRenderer'
