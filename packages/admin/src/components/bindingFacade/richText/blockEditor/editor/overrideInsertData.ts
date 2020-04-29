import { ResolvedDiscriminatedData } from '../../../discrimination'
import { ContemberEmbedElement, contemberEmbedElementType } from '../elements'
import { EmbedHandler, NormalizedEmbedHandlers } from '../embed'
import { BlockSlateEditor } from './BlockSlateEditor'

export interface OverrideInsertDataOptions {
	embedHandlers: NormalizedEmbedHandlers | undefined
}

export const overrideInsertData = <E extends BlockSlateEditor>(editor: E, options: OverrideInsertDataOptions) => {
	const { insertData } = editor

	editor.insertData = data => {
		const text = data.getData('text/plain').trim()

		if (!text) {
			return insertData(data)
		}

		let url: URL | undefined = undefined

		try {
			url = new URL(text)
		} catch {}

		let embedHandler: ResolvedDiscriminatedData<EmbedHandler> | undefined = undefined
		let embedArtifacts: any = undefined

		for (const [, handler] of options.embedHandlers!.data) {
			const result = handler.data.canHandleSource(text, url)
			if (result !== false) {
				embedHandler = handler
				embedArtifacts = result
				break
			}
		}

		if (embedHandler === undefined) {
			return insertData(data)
		}

		const embedBlock: ContemberEmbedElement = {
			type: contemberEmbedElementType,
			children: [{ text: '' }],
			source: text,
			entityKey: '', // TODO fix this crap
			embedHandler,
			embedArtifacts,
		}

		return editor.insertNode(embedBlock)
	}
}
