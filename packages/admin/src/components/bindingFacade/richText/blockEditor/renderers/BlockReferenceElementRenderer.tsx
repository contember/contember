import { BindingError, Entity, RelativeSingleField, useParentEntityAccessor } from '@contember/binding'
import { ActionableBox, Box, EditorBox } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor } from 'slate-react'
import { getDiscriminatedDatum } from '../../../discrimination'
import { BlockElement } from '../../baseEditor'
import { BlockSlateEditor } from '../editor'
import { BlockReferenceElement } from '../elements'
import { EditorReferenceBlocks } from '../templating'

export interface BlockReferenceElementRendererProps extends RenderElementProps {
	element: BlockReferenceElement
	referenceDiscriminationField: RelativeSingleField
	editorReferenceBlocks: EditorReferenceBlocks
}

export const BlockReferenceElementRenderer = React.memo((props: BlockReferenceElementRendererProps) => {
	const editor = useEditor() as BlockSlateEditor

	const referencedEntity = useParentEntityAccessor()

	const discriminationField = referencedEntity.getRelativeSingleField(props.referenceDiscriminationField)
	const discriminatedBlock = getDiscriminatedDatum(props.editorReferenceBlocks, discriminationField)
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

	const blockTemplate = selectedBlock.template

	if (blockTemplate === undefined) {
		throw new BindingError(
			`BlockEditor: All block reference elements must at least use the BlockEditor.ContentOutlet component! ` +
				`It may only appear at the very top level of the block.`,
		)
	}
	const contentTemplate = blockTemplate.blockContent
	if (contentTemplate === undefined) {
		throw new BindingError(
			`BlockEditor: All block reference elements must at least use the BlockEditor.ContentOutlet component!\n\n` +
				`It appears that other BlockEditor._____ components have been used but the BlockEditor.ContentOutlet is ` +
				`missing or isn't at the very top level.`,
		)
	}

	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			<Entity accessor={referencedEntity}>
				<ActionableBox editContents={alternate} onRemove={onRemove}>
					<EditorBox heading={selectedBlock.label}>
						{!!contentTemplate.nodeBefore && <div contentEditable={false}>{contentTemplate.nodeBefore}</div>}
						{props.children}
						{!!contentTemplate.nodeAfter && <div contentEditable={false}>{contentTemplate.nodeAfter}</div>}
					</EditorBox>
				</ActionableBox>
			</Entity>
		</BlockElement>
	)
})
BlockReferenceElementRenderer.displayName = 'BlockReferenceElementRenderer'
