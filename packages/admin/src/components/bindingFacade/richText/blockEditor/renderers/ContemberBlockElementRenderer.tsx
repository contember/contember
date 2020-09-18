import { BindingError, EntityAccessor, RelativeSingleField, RemovalType, SingleEntity } from '@contember/binding'
import { ActionableBox, Box } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../../blocks'
import { BlockSlateEditor } from '../editor'
import { ContemberBlockElement } from '../elements'

export interface ContemberBlockElementRendererProps extends RenderElementProps {
	element: ContemberBlockElement
	entity: EntityAccessor
	discriminationField: RelativeSingleField
	normalizedBlocks: NormalizedBlocks
}

export const ContemberBlockElementRenderer = React.memo((props: ContemberBlockElementRendererProps) => {
	const editor = useEditor() as BlockSlateEditor
	const selected = useSelected()

	// TODO remove button, dragHandle, etc.
	const discriminationField = props.entity.getRelativeSingleField(props.discriminationField)
	const discriminatedBlock = getDiscriminatedBlock(props.normalizedBlocks, discriminationField)
	const onContainerClick = React.useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (e.target === e.currentTarget) {
				const path = ReactEditor.findPath(editor, props.element)
				Transforms.select(editor, path)
			}
		},
		[editor, props.element],
	)
	const addDefaultElement = (offset: number) => {
		const [topLevelIndex] = ReactEditor.findPath(editor, props.element)
		const targetPath = [topLevelIndex + offset]
		Transforms.insertNodes(editor, editor.createDefaultElement([{ text: '' }]), {
			at: targetPath,
		})
		Transforms.select(editor, targetPath)
	}

	if (!discriminatedBlock) {
		throw new BindingError(`BlockEditor: Trying to render an entity with an undefined block type.`)
	}

	const selectedBlock = discriminatedBlock.datum
	const alternate = selectedBlock.alternate ? <Box>{selectedBlock.alternate}</Box> : undefined

	return (
		<div {...props.attributes}>
			{/* https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245 */}
			<div contentEditable={false} data-slate-editor={false}>
				<SingleEntity accessor={props.entity}>
					<div onClick={() => addDefaultElement(0)} style={{ height: '1em' }} />
					<ActionableBox editContents={alternate} onRemove={selected ? undefined : () => props.entity.deleteEntity()}>
						<Box heading={selectedBlock.label} isActive={selected} onClick={onContainerClick} style={{ margin: '0' }}>
							{selectedBlock.children}
						</Box>
					</ActionableBox>
					<div onClick={() => addDefaultElement(1)} style={{ height: '1em' }} />
				</SingleEntity>
			</div>
			{props.children}
		</div>
	)
})
ContemberBlockElementRenderer.displayName = 'ContemberBlockElementRenderer'
