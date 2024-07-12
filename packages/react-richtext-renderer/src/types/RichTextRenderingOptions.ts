import { RichTextElement, RichTextLeaf } from './structure'
import { ReferenceRendererMap, RenderBlock, RenderElement, RenderLeaf } from './custom'
import { RichTextReference } from './RichTextReference'
import { RichTextReferenceMetadata } from './RichTextReferenceMetadata'

export type UndefinedReferenceHandler<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference
> = (referenceId: string) => void | RichTextReferenceMetadata<CustomElements, CustomLeaves, Reference>

export type RichTextRenderingOptions<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
	Reference extends RichTextReference = RichTextReference,
> = {
	renderElement?: RenderElement<CustomElements, CustomLeaves>
	renderLeaf?: RenderLeaf<CustomLeaves>
	renderBlock?: RenderBlock
	referenceRenderers?: ReferenceRendererMap<any, CustomElements, CustomLeaves>
	undefinedReferenceHandler?: UndefinedReferenceHandler<CustomElements, CustomLeaves, Reference>
	attributeNamePrefix?: string
}
