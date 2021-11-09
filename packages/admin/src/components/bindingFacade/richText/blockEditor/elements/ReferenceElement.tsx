import { Element, Node, Path, Transforms } from 'slate'
import type { ElementWithReference } from './ElementWithReference'
import { CustomElementPlugin } from '../../baseEditor'
import { ReferenceElementRenderer } from '../renderers'
import { BindingError, EntityAccessor, FieldValue, RelativeSingleField } from '@contember/binding'
import { getDiscriminatedDatum } from '../../../discrimination'
import { EditorReferenceBlocks } from '../templating'
import { NormalizedEmbedHandlers } from '../embed'
import { NormalizedBlocks } from '../../../blocks'
import { ReactEditor } from 'slate-react'

type ReferenceElementType = 'reference'
export const referenceElementType: ReferenceElementType = 'reference'

export interface ReferenceElement extends ElementWithReference {
	type: ReferenceElementType
}

export const isReferenceElement = (node: Node): node is ReferenceElement =>
	Element.isElement(node) && node.type === referenceElementType

export interface ReferenceElementOptions {
	referenceDiscriminationField: RelativeSingleField | undefined
	editorReferenceBlocks: EditorReferenceBlocks

	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
	embedContentDiscriminationField: RelativeSingleField | undefined
	embedSubBlocks: NormalizedBlocks | undefined
	getReferencedEntity: (path: Path, referenceId: string) => EntityAccessor
}

export const createReferenceElementPlugin = (args: ReferenceElementOptions): CustomElementPlugin<ReferenceElement> => {
	return ({
		type: referenceElementType,
		render: props => {
			if (!args.referenceDiscriminationField) {
				throw new Error()
			}
			return <ReferenceElementRenderer {...args} {...props} referenceDiscriminationField={args.referenceDiscriminationField} />
		},
		isVoid: ({ element, editor }) => {
			if (args.referenceDiscriminationField === undefined) {
				throw new BindingError()
			}
			const path = ReactEditor.findPath(editor, element)
			const referencedEntity = args.getReferencedEntity(path, element.referenceId)
			const discriminationField = referencedEntity.getRelativeSingleField(args.referenceDiscriminationField)
			const selectedReference = getDiscriminatedDatum(args.editorReferenceBlocks, discriminationField)?.datum

			if (selectedReference === undefined) {
				throw new BindingError()
			}

			return selectedReference.template === undefined
		},
		normalizeNode: ({ editor, element, path }) => {
			const referenceId = element.referenceId
			try {
				args.getReferencedEntity(path, referenceId)
			} catch {
				console.warn(`Removing a node linking a non-existent reference id '${referenceId}'.`)
				Transforms.delete(editor, { at: path })
			}
		},
	})
}
