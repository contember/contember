import { BindingError, Entity, FieldValue, RelativeSingleField, useEntity } from '@contember/binding'
import { ActionableBox, Box, EditorBox } from '@contember/ui'
import { memo, MouseEvent as ReactMouseEvent, ReactNode, useCallback } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { BlockProps, getDiscriminatedBlock, NormalizedBlocks } from '../../../blocks'
import { getDiscriminatedDatum } from '../../../discrimination'
import { BlockElement } from '../../baseEditor'
import { BlockSlateEditor } from '../editor'
import { ReferenceElement } from '../elements'
import { EmbedHandler, NormalizedEmbedHandlers } from '../embed'
import { EditorReferenceBlocks } from '../templating'

export interface ReferenceElementRendererProps extends RenderElementProps {
	element: ReferenceElement
	referenceDiscriminationField: RelativeSingleField
	editorReferenceBlocks: EditorReferenceBlocks

	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
}

export const ReferenceElementRenderer = memo((props: ReferenceElementRendererProps) => {
	const editor = useEditor() as BlockSlateEditor
	const selected = useSelected()

	const referencedEntity = useEntity()

	const discriminationField = referencedEntity.getRelativeSingleField(props.referenceDiscriminationField)
	const selectedReference = getDiscriminatedDatum(props.editorReferenceBlocks, discriminationField)?.datum

	if (!selectedReference) {
		throw new BindingError(`BlockEditor: Trying to render a reference with an undefined reference type.`)
	}
	const elementTemplate = selectedReference.template
	const isEditable = elementTemplate !== undefined

	const onContainerClick = useCallback(
		(e: ReactMouseEvent<HTMLElement>) => {
			if (e.target === e.currentTarget) {
				const path = ReactEditor.findPath(editor, props.element)
				Transforms.select(editor, path)
			}
		},
		[editor, props.element],
	)
	const onRemove = useCallback(() => {
		const path = ReactEditor.findPath(editor, props.element)
		Transforms.removeNodes(editor, {
			at: path,
		})
	}, [editor, props.element])

	let blockBody: ReactNode
	let renderedBlock: BlockProps = selectedReference
	let isFullWidth = true

	if (elementTemplate !== undefined) {
		const contentTemplate = elementTemplate.blockContent
		if (contentTemplate === undefined) {
			throw new BindingError(
				`BlockEditor: All block reference elements must at least use the BlockEditor.ContentOutlet component!\n\n` +
					`It appears that other BlockEditor._____ components have been used but the BlockEditor.ContentOutlet is ` +
					`missing or isn't at the very top level.`,
			)
		}
		blockBody = (
			<>
				{!!contentTemplate.nodeBefore && <div contentEditable={false}>{contentTemplate.nodeBefore}</div>}
				{props.children}
				{!!contentTemplate.nodeAfter && <div contentEditable={false}>{contentTemplate.nodeAfter}</div>}
			</>
		)
	} else if (
		props.embedReferenceDiscriminateBy !== undefined &&
		discriminationField.hasValue(props.embedReferenceDiscriminateBy)
	) {
		if (
			props.embedContentDiscriminationField === undefined ||
			props.embedHandlers === undefined ||
			props.embedSubBlocks === undefined
		) {
			throw new BindingError(
				`BlockEditor: Trying to render an embed element without all the correct settings. ` +
					`Check the related BlockEditor props.`,
			)
		}
		const embedTypeDiscriminant = referencedEntity.getRelativeSingleField(props.embedContentDiscriminationField)
		const embedHandler = getDiscriminatedDatum(props.embedHandlers, embedTypeDiscriminant)
		const subBlock = getDiscriminatedBlock(props.embedSubBlocks, embedTypeDiscriminant)

		if (embedHandler === undefined) {
			throw new BindingError(`BlockEditor: Missing handler for embed of type '${embedTypeDiscriminant.value}'.`)
		}
		if (subBlock === undefined) {
			throw new BindingError(`BlockEditor: Missing Block for embed of type '${embedTypeDiscriminant.value}'.`)
		}
		isFullWidth = false
		renderedBlock = subBlock.datum
		blockBody = (
			<div
				// This is a bit of a hack to avoid rendering any whitespace
				style={{ display: 'flex' }}
			>
				{/*{selectedBlock.children}*/}
				<EmbedElementRendererInner handler={embedHandler.datum} />
			</div>
		)
	} else {
		blockBody = renderedBlock.children
	}

	const alternate = renderedBlock.alternate ? <Box>{renderedBlock.alternate}</Box> : undefined
	const wrappedReference = (
		<Entity accessor={referencedEntity}>
			<ActionableBox editContents={alternate} onRemove={onRemove}>
				<EditorBox
					heading={renderedBlock.label}
					isActive={selected && !isEditable}
					onClick={isEditable ? onContainerClick : undefined}
				>
					{blockBody}
				</EditorBox>
			</ActionableBox>
		</Entity>
	)

	return (
		<BlockElement element={props.element} attributes={props.attributes} withBoundaries>
			{isEditable ? (
				wrappedReference
			) : (
				// https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245
				<>
					<div
						contentEditable={false}
						data-slate-editor={false}
						style={isFullWidth ? undefined : { display: 'inline-block' }}
					>
						{wrappedReference}
					</div>
					{props.children}
				</>
			)}
		</BlockElement>
	)
})
ReferenceElementRenderer.displayName = 'ReferenceElementRenderer'

// This is to make sure that if someone decides to use hooks directly inside the renderEmbed function,
// it doesn't break (provided they don't break rules of hooks further) because React will think that
// this component called them.
function EmbedElementRendererInner({ handler }: { handler: EmbedHandler }) {
	return <>{handler.renderEmbed()}</>
}
