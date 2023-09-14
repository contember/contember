import type { FieldValue, RelativeSingleField } from '@contember/react-binding'
import { Descendant, Element as SlateElement, Node as SlateNode, Text } from 'slate'
import type { ResolvedDiscriminatedDatum } from '../../../discrimination'
import { ReferenceElement, referenceElementType } from '../elements'
import type { EmbedHandler, NormalizedEmbedHandlers } from '../embed'
import type { EditorWithBlocks } from './EditorWithBlocks'
import { parseUrl } from '../../utils'
import { EditorTransforms } from '../../slate-reexport'
import { isInReferenceElement } from '../utils'

export interface OverrideInsertDataOptions {
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
	embedContentDiscriminationField: RelativeSingleField | undefined
}

export const overrideInsertData = <E extends EditorWithBlocks>(editor: E, options: OverrideInsertDataOptions) => {
	let { insertData, insertFragment } = editor

	const stripNodeReferences = (nodes: SlateNode[]): SlateNode[] =>
		nodes.flatMap(node => {
			if (Text.isText(node)) {
				return node as SlateNode
			}
			if (SlateElement.isElement(node) && 'referenceId' in node) {
				// Essentially unwrapping the node.
				return stripNodeReferences((node as SlateElement).children)
			}
			return {
				...node,
				children: stripNodeReferences(node.children),
			} as Descendant
		})

	editor.insertFragment = fragment => {
		insertFragment(stripNodeReferences(fragment))
	}

	editor.insertData = data => {
		if (editor.selection && isInReferenceElement(editor)) {
			const text = data.getData('text/plain').trim()
			EditorTransforms.insertText(editor, text)
			return // No splitting of references. We'd have to clone the reference and we don't know how to do that yet.
		}
		return insertData(data)
	}

	const { embedReferenceDiscriminateBy, embedHandlers, embedContentDiscriminationField } = options

	if (
		embedReferenceDiscriminateBy === undefined ||
		embedHandlers === undefined ||
		embedContentDiscriminationField === undefined
	) {
		return
	}

	const insertEmbed = <T>(embedHandler: ResolvedDiscriminatedDatum<EmbedHandler<T>>, embedArtifacts: T, source: string) => {
		const partialEmbedReference: Omit<ReferenceElement, 'referenceId'> = {
			type: referenceElementType,
			children: [{ text: '' }],
		}

		return editor.insertElementWithReference(partialEmbedReference, embedReferenceDiscriminateBy, getEmbedReference => {
			getEmbedReference()
				.getRelativeSingleField(embedContentDiscriminationField)
				.updateValue(embedHandler!.discriminateBy)
			const reference = getEmbedReference()
			embedHandler!.datum.populateEmbedData({
				embedArtifacts,
				source,
				entity: reference,
			})
		})
	}

	const insertDataEmbed = editor.insertData
	editor.insertData = data => {
		if (data.getData('application/x-slate-fragment')) {
			return insertDataEmbed(data)
		}

		const text = data.getData('text/plain').trim()
		if (!text) {
			return insertDataEmbed(data)
		}

		const url = parseUrl(text)

		;(async () => {
			for (const [, handler] of options.embedHandlers!) {
				const result = await handler.datum.handleSource(text, url)
				if (result !== undefined) {
					return insertEmbed(handler, result, text)
				}
			}
			insertDataEmbed(data)
		})()
	}
}
