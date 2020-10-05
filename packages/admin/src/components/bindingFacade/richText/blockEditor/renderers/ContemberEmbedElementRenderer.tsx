import { EntityAccessor, RelativeSingleField, RemovalType, SingleEntity } from '@contember/binding'
import { ActionableBox, Box } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../../blocks'
import { BlockElement } from '../../baseEditor'
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

	const selectedBlock = discriminatedBlock?.datum
	const alternate = selectedBlock?.alternate ? <Box>{selectedBlock.alternate}</Box> : undefined

	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			{/* https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245 */}
			<div contentEditable={false} data-slate-editor={false}>
				<SingleEntity accessor={props.entity}>
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
									{props.element.embedHandler.datum.renderEmbed({
										entity: props.entity,
									})}
								</div>
							</Box>
						</ActionableBox>
					</div>
				</SingleEntity>
			</div>
			{props.children}
		</BlockElement>
	)
})
ContemberEmbedElementRenderer.displayName = 'ContemberEmbedElementRenderer'
