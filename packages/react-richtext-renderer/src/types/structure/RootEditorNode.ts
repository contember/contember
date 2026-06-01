import type { RichTextElement } from './RichTextElement.js'
import type { RichTextLeaf } from './RichTextLeaf.js'
import { RichTextChild } from './RichTextChild.js'

export interface RootEditorNode<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	formatVersion: number
	children: readonly RichTextChild<CustomElements, CustomLeaves>[]
}
