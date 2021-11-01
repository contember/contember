import type { FieldValue, RelativeSingleField } from '@contember/binding'
import { Descendant, Element as SlateElement, Node as SlateNode, Text } from 'slate'
import type { ResolvedDiscriminatedDatum } from '../../../discrimination'
import { ReferenceElement, referenceElementType } from '../elements'
import type { EmbedHandler, NormalizedEmbedHandlers } from '../embed'
import type { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertDataOptions {
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
	embedContentDiscriminationField: RelativeSingleField | undefined
}

export const overrideInsertData = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertDataOptions) => {
	const { insertData, insertFragment } = editor

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

	editor.insertData = data => {
		if (data.getData('application/x-slate-fragment')) {
			return insertData(data)
		}

		const text = data.getData('text/plain').trim()
		if (!text) {
			return insertData(data)
		}

		let url: URL | undefined = undefined

		if (text.length >= 4) {
			// See isUrl(). This branch is just a quick bailout

			try {
				url = new URL(text)
			} catch {}
		}

		;(async () => {
			for (const [, handler] of options.embedHandlers!) {
				const result = await handler.datum.handleSource(text, url)
				if (result !== undefined) {
					return insertEmbed(handler, result, text)
				}
			}
			insertData(data)
		})()
	}
}
