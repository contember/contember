import { Element, Node } from 'slate'
import type { ElementWithReference } from './ElementWithReference'
import { CustomElementPlugin } from '../../baseEditor'
import { ReferenceElementRenderer } from '../renderers/ReferenceElementRenderer'
import { BindingError, FieldValue, RelativeSingleField } from '@contember/binding'
import { getDiscriminatedDatum } from '../../../discrimination'
import { EditorWithBlockElements } from '../editor'
import { EditorReferenceBlocks } from '../templating'
import { NormalizedEmbedHandlers } from '../embed'
import { NormalizedBlocks } from '../../../blocks'

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
		isVoid: ({ editor, element }) => {
			if (args.referenceDiscriminationField === undefined) {
				throw new BindingError()
			}
			const blockEditor = editor as EditorWithBlockElements
			const referencedEntity = blockEditor.getReferencedEntity(element)
			const discriminationField = referencedEntity.getRelativeSingleField(args.referenceDiscriminationField)
			const selectedReference = getDiscriminatedDatum(args.editorReferenceBlocks, discriminationField)?.datum

			if (selectedReference === undefined) {
				throw new BindingError()
			}

			return selectedReference.template === undefined
		},
	})
}
