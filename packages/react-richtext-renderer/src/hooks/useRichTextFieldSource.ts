import { RichTextBlock, RichTextElement, RichTextFieldSource, RichTextLeaf } from '../types'
import { useMemo } from 'react'
import { defaultDeserialize } from '../internal/defaultDeserialize'

export const useRichTextFieldSource = <CustomElements extends RichTextElement, CustomLeaves extends RichTextLeaf>({
	source,
	deserialize = defaultDeserialize,
}: RichTextFieldSource<CustomElements, CustomLeaves>): RichTextBlock<CustomElements, CustomLeaves>[] => {
	return useMemo(() => {
		return [
			{
				content: source
					? (typeof source === 'string' ? deserialize(source) : source)
					: {
						formatVersion: 0,
						children: [],
					},
				id: undefined,
				referencesField: undefined,
				referenceDiscriminationField: undefined,
				referenceRenderers: {},
				references: undefined,
			},
		]
	}, [deserialize, source])
}
