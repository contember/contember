import { RichTextLeaf } from './RichTextLeaf'

export interface RichTextElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	children: RichTextElement<CustomElements, CustomLeaves>[] | Array<CustomLeaves | RichTextLeaf>
}
