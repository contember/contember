import { EntityAccessor, RelativeSingleField, RemovalType, SingleEntity } from '@contember/binding'
import { ActionableBox, Box } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../../blocks'
import { BlockSlateEditor } from '../editor'
import { ContemberEmbedElement } from '../elements'

export interface ContemberEmbedElementRendererProps extends RenderElementProps {
	element: ContemberEmbedElement
	entity: EntityAccessor
	embedContentDiscriminationField: RelativeSingleField
	embedSubBlocks: NormalizedBlocks
}

export const ContemberEmbedElementRenderer = React.memo((props: ContemberEmbedElementRendererProps) => {
	const editor = useEditor() as BlockSlateEditor
	const selected = useSelected()

	// TODO remove button, dragHandle, etc.
	const discriminant = props.entity.getRelativeSingleField(props.embedContentDiscriminationField)
	const discriminatedBlock = getDiscriminatedBlock(props.embedSubBlocks, discriminant)
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

	const selectedBlock = discriminatedBlock?.data
	const alternate = selectedBlock?.alternate ? <Box>{selectedBlock.alternate}</Box> : undefined

	return (
		<div {...props.attributes}>
			{/* https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245 */}
			<div contentEditable={false} data-slate-editor={false}>
				<SingleEntity accessor={props.entity}>
					<div onClick={() => addDefaultElement(0)} style={{ height: '1em' }} />
					<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
						<ActionableBox
							editContents={alternate || null}
							onRemove={selected ? undefined : () => props.entity.deleteEntity()}
						>
							<Box heading={selectedBlock?.label} isActive={selected} onClick={onContainerClick}>
								<div
									// This is a bit of a hack to avoid rendering any whitespace
									style={{ display: 'flex' }}
								>
									{/*{selectedBlock.children}*/}
									{props.element.embedHandler.data.renderEmbed({
										entity: props.entity,
									})}
								</div>
							</Box>
						</ActionableBox>
					</div>
					<div onClick={() => addDefaultElement(1)} style={{ height: '1em' }} />
				</SingleEntity>
			</div>
			{props.children}
		</div>
	)
})
ContemberEmbedElementRenderer.displayName = 'ContemberEmbedElementRenderer'
