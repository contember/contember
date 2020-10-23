import { FieldValue, RelativeSingleField } from '@contember/binding'
import { ResolvedDiscriminatedDatum } from '../../../discrimination'
import { EmbedElement, embedElementType } from '../elements'
import { EmbedHandler, NormalizedEmbedHandlers } from '../embed'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertDataOptions {
	embedHandlers: NormalizedEmbedHandlers | undefined
	embedReferenceDiscriminateBy: FieldValue | undefined
	embedContentDiscriminationField: RelativeSingleField | undefined
}

export const overrideInsertData = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertDataOptions) => {
	const { insertData } = editor

	const { embedReferenceDiscriminateBy, embedHandlers, embedContentDiscriminationField } = options

	if (
		embedReferenceDiscriminateBy === undefined ||
		embedHandlers === undefined ||
		embedContentDiscriminationField === undefined
	) {
		return
	}

	editor.insertData = data => {
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

		let embedHandler: ResolvedDiscriminatedDatum<EmbedHandler> | undefined = undefined
		let embedArtifacts: any = undefined

		for (const [, handler] of options.embedHandlers!) {
			const result = handler.datum.canHandleSource(text, url)
			if (result !== false) {
				embedHandler = handler
				embedArtifacts = result
				break
			}
		}

		if (embedHandler === undefined) {
			return insertData(data)
		}

		const partialEmbed: Omit<EmbedElement, 'referenceId'> = {
			type: embedElementType,
			children: [{ text: '' }],
		}

		return editor.insertElementWithReference(partialEmbed, embedReferenceDiscriminateBy, getEmbedReference => {
			getEmbedReference()
				.getRelativeSingleField(embedContentDiscriminationField)
				.updateValue(embedHandler!.discriminateBy)
			const reference = getEmbedReference()
			embedHandler!.datum.populateEmbedData({
				embedArtifacts,
				source: text,
				batchUpdates: reference.batchUpdates,
				environment: reference.environment,
			})
		})
	}
}
