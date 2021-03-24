import { createContext, useContext } from 'react'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
import { RichTextReference } from './RichTextReference'
import { RichTextRenderMetadata } from './RichTextRenderMetadata'

export const RichTextRenderMetadataContext = createContext<RichTextRenderMetadata<any, any, any>>({
	formatVersion: 0,
	referenceDiscriminationField: undefined,
	referenceRenderers: {},
	references: undefined,
})
RichTextRenderMetadataContext.displayName = 'RichTextRenderMetadataContext'

export const useRichTextRenderMetadata = <
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
	Reference extends RichTextReference = RichTextReference
>() => useContext(RichTextRenderMetadataContext) as RichTextRenderMetadata<CustomElements, CustomLeaves, Reference>
