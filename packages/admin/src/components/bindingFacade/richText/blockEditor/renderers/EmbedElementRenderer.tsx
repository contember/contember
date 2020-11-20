import { BindingError, FieldValue, RelativeSingleField, Entity, useEntity } from '@contember/binding'
import { ActionableBox, Box, EditorBox } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { getDiscriminatedBlock, NormalizedBlocks } from '../../../blocks'
import { getDiscriminatedDatum } from '../../../discrimination'
import { BlockElement } from '../../baseEditor'
import { BlockSlateEditor } from '../editor'
import { EmbedElement } from '../elements'
import { EmbedHandler, NormalizedEmbedHandlers } from '../embed'

export interface EmbedElementRendererProps extends RenderElementProps {
	element: EmbedElement

	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
}

export const EmbedElementRenderer = React.memo(
	({
		children,
		attributes,
		embedHandlers,
		embedContentDiscriminationField,
		element,
		embedReferenceDiscriminateBy,
		embedSubBlocks,
	}: EmbedElementRendererProps) => {
		if (
			embedSubBlocks === undefined ||
			embedHandlers === undefined ||
			embedContentDiscriminationField === undefined ||
			embedReferenceDiscriminateBy === undefined
		) {
			throw new BindingError(
				`BlockEditor: Trying to render an embed element without all the correct settings. ` +
					`Check the related BlockEditor props.`,
			)
		}

		const editor = useEditor() as BlockSlateEditor
		const selected = useSelected()

		const referencedEntity = useEntity()
		const embedTypeDiscriminant = referencedEntity.getRelativeSingleField(embedContentDiscriminationField)

		const embedHandler = getDiscriminatedDatum(embedHandlers, embedTypeDiscriminant)

		// TODO remove button, dragHandle, etc.

		const discriminatedBlock = getDiscriminatedBlock(embedSubBlocks, embedTypeDiscriminant)
		const onContainerClick = React.useCallback(
			(e: React.MouseEvent<HTMLElement>) => {
				if (e.target === e.currentTarget) {
					const path = ReactEditor.findPath(editor, element)
					Transforms.select(editor, path)
				}
			},
			[editor, element],
		)
		const onRemove = React.useCallback(() => {
			const path = ReactEditor.findPath(editor, element)
			Transforms.removeNodes(editor, {
				at: path,
			})
		}, [editor, element])

		const selectedBlock = discriminatedBlock?.datum
		const alternate = selectedBlock?.alternate ? <Box>{selectedBlock.alternate}</Box> : undefined

		if (embedHandler === undefined) {
			throw new BindingError(`BlockEditor: Missing handler for embed of type '${embedTypeDiscriminant.currentValue}'.`)
		}

		return (
			<BlockElement element={element} attributes={attributes} withBoundaries>
				{/* https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245 */}
				<div contentEditable={false} data-slate-editor={false}>
					<Entity accessor={referencedEntity}>
						<div style={{ display: 'flex', justifyContent: 'flex-start' }}>
							<ActionableBox editContents={alternate || null} onRemove={onRemove}>
								<EditorBox heading={selectedBlock?.label} isActive={selected} onClick={onContainerClick}>
									<div
										// This is a bit of a hack to avoid rendering any whitespace
										style={{ display: 'flex' }}
									>
										{/*{selectedBlock.children}*/}
										<EmbedElementRendererInner handler={embedHandler.datum} />
									</div>
								</EditorBox>
							</ActionableBox>
						</div>
					</Entity>
				</div>
				{children}
			</BlockElement>
		)
	},
)
EmbedElementRenderer.displayName = 'EmbedElementRenderer'

// This is to make sure that if someone decides to use hooks directly inside the renderEmbed function,
// it doesn't break (provided they don't break rules of hooks further) because React will think that
// this component called them.
function EmbedElementRendererInner({ handler }: { handler: EmbedHandler }) {
	return <>{handler.renderEmbed()}</>
}
