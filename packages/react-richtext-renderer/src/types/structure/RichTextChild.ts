import { RichTextLeaf } from './RichTextLeaf.js'
import { RichTextElement } from './RichTextElement.js'
import { BuiltinElements, BuiltinLeaves } from '../builtin/index.js'

export type RichTextChild<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = RichTextLeaf,
> =
	| BuiltinElements<CustomElements, CustomLeaves>
	| CustomElements
	| (BuiltinLeaves & CustomLeaves)
