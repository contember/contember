import { RichTextLeaf } from './RichTextLeaf'
import { RichTextElement } from './RichTextElement'
import { BuiltinElements, BuiltinLeaves } from '../builtin'

export type RichTextChild<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> =
	| BuiltinElements<CustomElements, CustomLeaves>
	| CustomElements
	| (BuiltinLeaves & CustomLeaves)
