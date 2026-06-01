import type { RichTextLeaf } from './RichTextLeaf.js'
import { RichTextChild } from './RichTextChild.js'

export interface RichTextElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	type: string
	children: readonly RichTextChild<CustomElements, CustomLeaves>[]
	referenceId?: string
}
