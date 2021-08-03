import type { BuiltinElements } from './BuiltinElements'
import type { BuiltinLeaves } from './BuiltinLeaves'
import type { RichTextElement } from './RichTextElement'
import type { RichTextLeaf } from './RichTextLeaf'

export interface RootEditorNode<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never,
> {
	formatVersion: number
	children: Array<BuiltinElements<CustomElements, CustomLeaves> | CustomElements | BuiltinLeaves | CustomLeaves>
}
