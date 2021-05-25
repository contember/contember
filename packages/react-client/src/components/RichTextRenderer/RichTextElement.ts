import type { RichTextLeaf } from './RichTextLeaf'

export interface RichTextElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	type: string
	children: RichTextElement<CustomElements, CustomLeaves>[] | Array<CustomLeaves | RichTextLeaf>
	referenceId?: string
}
