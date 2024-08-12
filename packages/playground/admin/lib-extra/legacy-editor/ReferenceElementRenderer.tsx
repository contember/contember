import { BindingError, Entity, RelativeSingleField, useEntity } from '@contember/react-binding'
import { BlockProps, EditorWithBlocks, EmbedHandler, getDiscriminatedBlock, getDiscriminatedDatum, ReferenceElement, ReferenceElementOptions } from '@contember/react-slate-editor-legacy'
import { memo, MouseEvent as ReactMouseEvent, ReactNode, useCallback } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSelected, useSlateStatic } from 'slate-react'
import { Card, CardContent, CardHeader, CardTitle } from '@app/lib/ui/card'
import { PencilIcon, TrashIcon } from 'lucide-react'
import { Button } from '@app/lib/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@app/lib/ui/popover'
import { BlockElement } from '@app/lib/editor'

export interface ReferenceElementRendererProps extends RenderElementProps, ReferenceElementOptions {
	element: ReferenceElement
	referenceDiscriminationField: RelativeSingleField
}

export const ReferenceElementRenderer = memo((props: ReferenceElementRendererProps) => {
	const editor = useSlateStatic() as EditorWithBlocks
	const selected = useSelected()

	const referencedEntity = useEntity()

	const discriminationField = referencedEntity.getField(props.referenceDiscriminationField)
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
		Promise.resolve().then(() => {
			// This is a hack. Otherwise if the removed block is the last one, we get an exception from Slate whose onClick
			// handler is also trying to do something with this element. So we just schedule a micro task, let it do its
			// thing and just remove the node later.
			return Transforms.removeNodes(editor, {
				at: path,
			})
		}).catch(() => {})
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
		const placeholder = contentTemplate.value.placeholder
		const showPlaceholder = placeholder !== undefined && props.element.children.length === 1 && props.element.children[0]?.text === ''
		blockBody = (
			<>
				{!!contentTemplate.nodeBefore && <div contentEditable={false}>{contentTemplate.nodeBefore}</div>}
				{showPlaceholder
					? (
						<div style={{ position: 'relative' }}>
							<div style={{ position: 'absolute', pointerEvents: 'none' }} contentEditable={false}>
								<div>{placeholder}</div>
							</div>
							<div>{props.children}</div>
						</div>
					) : (
						<div>{props.children}</div>
					)
				}
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
		const embedTypeDiscriminant = referencedEntity.getField(props.embedContentDiscriminationField)
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

	const wrappedReference = (
		<Entity accessor={referencedEntity}>
			<Card className="group">
				<CardHeader contentEditable={false}>
					<div className="flex">
						<CardTitle >
							{renderedBlock.label}
						</CardTitle>
						<div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
							<Button variant="destructive" onClick={onRemove} size="sm"><TrashIcon className="w-3 h-3"/></Button>
							{renderedBlock.alternate && (<Popover>
								<PopoverTrigger asChild><Button size="sm"><PencilIcon className="w-3 h-3" /></Button></PopoverTrigger>
								<PopoverContent>{renderedBlock.alternate}</PopoverContent>
							</Popover>)}
						</div>
					</div>
				</CardHeader>
				<CardContent onClick={isEditable ? onContainerClick : undefined}>
					{blockBody}
				</CardContent>
			</Card>
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
