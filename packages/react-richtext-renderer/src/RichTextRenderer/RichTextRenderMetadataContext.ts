import { createContext, useContext } from 'react'
import type { RichTextElement } from './types/RichTextElement'
import type { RichTextLeaf } from './types/RichTextLeaf'
import type { RichTextReference } from './types/RichTextReference'
import type { RichTextRenderMetadata } from './types/RichTextRenderMetadata'

export const RichTextRenderMetadataContext = createContext<RichTextRenderMetadata<any, any, any>>({
	formatVersion: 0,
	referencesField: undefined,
	referenceDiscriminationField: undefined,
	referenceRenderers: {},
	references: undefined,
})
RichTextRenderMetadataContext.displayName = 'RichTextRenderMetadataContext'

export const useRichTextRenderMetadata = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference,
>() => useContext(RichTextRenderMetadataContext) as RichTextRenderMetadata<CustomElements, CustomLeaves, Reference>
