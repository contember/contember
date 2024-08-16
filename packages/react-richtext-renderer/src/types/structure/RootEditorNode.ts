import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'
import { RichTextChild } from './RichTextChild'

export interface RootEditorNode<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> {
	formatVersion: number
	children: readonly RichTextChild<CustomElements, CustomLeaves>[]
}
