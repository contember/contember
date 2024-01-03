import type { RichTextLeaf } from './RichTextLeaf'
import { RichTextChild } from './RichTextChild'

export interface RichTextElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	type: string
	children: readonly RichTextChild<CustomElements, CustomLeaves>[]
	referenceId?: string
}
