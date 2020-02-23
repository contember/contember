import { BindingError, Entity, EntityAccessor, RelativeSingleField, RemovalType } from '@contember/binding'
import { Box } from '@contember/ui'
import * as React from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useEditor, useSelected } from 'slate-react'
import { NormalizedBlock } from '../../../blocks'
import { RemoveEntityButton } from '../../../collections/helpers'
import { ContemberBlockElement } from '../elements'

export interface ContemberBlockElementRendererProps extends RenderElementProps {
	element: ContemberBlockElement
	entity: EntityAccessor
	removalType: RemovalType
	discriminationField: RelativeSingleField
	normalizedBlocks: NormalizedBlock[]
}

export const ContemberBlockElementRenderer = React.memo((props: ContemberBlockElementRendererProps) => {
	const editor = useEditor()
	const selected = useSelected()

	// TODO remove button, dragHandle, etc.
	const discriminationField = props.entity.getRelativeSingleField(props.discriminationField)
	const selectedBlock = props.normalizedBlocks.find(block => discriminationField.hasValue(block.discriminateBy))
	const onContainerClick = React.useCallback(
		(e: React.MouseEvent<HTMLElement>) => {
			if (e.target === e.currentTarget) {
				const path = ReactEditor.findPath(editor, props.element)
				Transforms.select(editor, path)
			}
		},
		[editor, props.element],
	)

	if (!selectedBlock) {
		throw new BindingError(`BlockEditor: Trying to render an entity with an undefined block type.`)
	}
	return (
		<div {...props.attributes}>
			{/* https://github.com/ianstormtaylor/slate/issues/3426#issuecomment-573939245 */}
			<div contentEditable={false} data-slate-editor={false}>
				<Entity accessor={props.entity}>
					<Box
						heading={selectedBlock.label}
						isActive={selected}
						actions={<RemoveEntityButton removalType={props.removalType} />}
						onClick={onContainerClick}
					>
						{selectedBlock.children}
					</Box>
				</Entity>
			</div>
			{props.children}
		</div>
	)
})
ContemberBlockElementRenderer.displayName = 'ContemberBlockElementRenderer'
