import { BuiltinElements } from './BuiltinElements'
import { BuiltinLeaves } from './BuiltinLeaves'
import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'

export interface RootEditorNode<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> {
	formatVersion: number
	children: Array<BuiltinElements<CustomElements, CustomLeaves> | CustomElements | BuiltinLeaves | CustomLeaves>
}
