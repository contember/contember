import type { FieldValue, RelativeSingleField } from '@contember/react-binding'
import { Descendant, Editor, Element as SlateElement, Node as SlateNode, Text, Transforms } from 'slate'
import type { ResolvedDiscriminatedDatum } from '../../discrimination/index.js'
import { ReferenceElement, referenceElementType } from '../elements/index.js'
import type { EmbedHandler, NormalizedEmbedHandlers } from '../embed/index.js'
import type { EditorWithBlocks } from './EditorWithBlocks.js'
import { parseUrl } from '../../utils/index.js'
import { isInReferenceElement } from '../utils/index.js'

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
			Transforms.insertText(editor, text)
			return // No splitting of references. We'd have to clone the reference and we don't know how to do that yet.
		}
		return insertData(data)
	}

	const { embedReferenceDiscriminateBy, embedHandlers, embedContentDiscriminationField } = options

	if (
		embedReferenceDiscriminateBy === undefined
		|| embedHandlers === undefined
		|| embedContentDiscriminationField === undefined
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
				.getField(embedContentDiscriminationField)
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

		// The insert has to happen asynchronously because embed handlers may need to fetch, but slate-react
		// restores the pre-event selection as soon as insertData returns synchronously. E.g. Safari delivers
		// autocorrections as an `insertReplacementText` beforeinput whose DataTransfer payload slate-react
		// routes through insertData with the word being replaced selected — without tracking that selection
		// through the restore, the correction would be inserted next to the original word instead of
		// replacing it.
		const selectionRef = editor.selection ? Editor.rangeRef(editor, editor.selection) : null
		;(async () => {
			try {
				const restoreSelection = () => {
					if (selectionRef?.current) {
						Transforms.select(editor, selectionRef.current)
					}
				}
				for (const [, handler] of options.embedHandlers!) {
					const result = await handler.datum.handleSource(text, url)
					if (result !== undefined) {
						restoreSelection()
						return insertEmbed(handler, result, text)
					}
				}
				restoreSelection()
				insertDataEmbed(data)
			} finally {
				selectionRef?.unref()
			}
		})()
	}
}
