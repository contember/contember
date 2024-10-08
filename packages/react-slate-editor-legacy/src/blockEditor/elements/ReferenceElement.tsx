import { Ancestor, Element, Node, Path } from 'slate'
import type { ElementWithReference } from './ElementWithReference'
import { BindingError, EntityAccessor, EntityId, FieldValue, RelativeSingleField } from '@contember/react-binding'
import { getDiscriminatedDatum } from '../../discrimination'
import { EditorReferenceBlocks } from '../templating'
import { NormalizedEmbedHandlers } from '../embed'
import { NormalizedBlocks } from '../../blocks'
import { ReactEditor, RenderElementProps } from 'slate-react'
import { ComponentType } from 'react'
import { EditorElementPlugin } from '@contember/react-slate-editor-base'

export const referenceElementType = 'reference' as const

export interface ReferenceElementRendererProps extends RenderElementProps, ReferenceElementOptions {
	element: ReferenceElement
	referenceDiscriminationField: RelativeSingleField
}

export interface ReferenceElement extends ElementWithReference {
	type: typeof referenceElementType
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
	getReferencedEntity: (path: Path, referenceId: EntityId) => EntityAccessor
	renderReference: ComponentType<ReferenceElementRendererProps> | undefined
}

const findElementPathFallback = (parent: Ancestor, element: ReferenceElement): Path | undefined => {
	for (const i in parent.children) {
		const child = parent.children[i]
		if (element === child) {
			return [Number(i)]
		}
		if (Element.isAncestor(child)) {
			const result = findElementPathFallback(child, element)
			if (result !== undefined) {
				return [Number(i), ...result]
			}
		}
	}
	return undefined
}

export const createReferenceElementPlugin = (args: ReferenceElementOptions): EditorElementPlugin<ReferenceElement> => {
	return ({
		type: referenceElementType,
		render: props => {
			if (!args.referenceDiscriminationField) {
				throw new Error()
			}
			if (!args.renderReference) {
				throw new Error(`ReferenceElement: renderReference is not set.`)
			}
			const Comp = args.renderReference
			return <Comp {...args} {...props} referenceDiscriminationField={args.referenceDiscriminationField} />
		},
		canContainAnyBlocks: true,
		isVoid: ({ element, editor }) => {
			if (args.referenceDiscriminationField === undefined) {
				throw new BindingError()
			}
			const path = (() => {
				try {
					return ReactEditor.findPath(editor, element)
				} catch (e) {
					return findElementPathFallback(editor, element)
				}
			})()
			if (!path) {
				return false
			}
			let referencedEntity: EntityAccessor | undefined
			try {
				referencedEntity = args.getReferencedEntity(path, element.referenceId)
			} catch (e) {
				return false
			}
			const discriminationField = referencedEntity.getField(args.referenceDiscriminationField)
			const selectedReference = getDiscriminatedDatum(args.editorReferenceBlocks, discriminationField)?.datum

			if (selectedReference === undefined) {
				throw new BindingError()
			}

			return selectedReference.template === undefined
		},
		// normalizeNode: ({ editor, element, path }) => {
		// 	const referenceId = element.referenceId
		// 	try {
		// 		args.getReferencedEntity(path, referenceId)
		// 	} catch {
		// 		console.warn(`Removing a node linking a non-existent reference id '${referenceId}'.`)
		// 		Transforms.delete(editor, { at: path })
		// 	}
		// },
	})
}
