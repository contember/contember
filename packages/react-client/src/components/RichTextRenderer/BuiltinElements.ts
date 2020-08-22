import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'

export type BuiltinElements<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> =
	| RichTextAnchorElement<CustomElements, CustomLeaves>
	| RichTextHeadingElement<CustomElements, CustomLeaves>
	| RichTextOrderedListElement<CustomElements, CustomLeaves>
	| RichTextUnorderedListElement<CustomElements, CustomLeaves>
	| RichTextListItemElement<CustomElements, CustomLeaves>
	| RichTextParagraphElement<CustomElements, CustomLeaves>
	| RichTextScrollTargetElement<CustomElements, CustomLeaves>

export interface RichTextAnchorElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'anchor'
	href: string
}

export interface RichTextHeadingElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'heading'
	level: 1 | 2 | 3 | 4 | 5 | 6
	isNumbered?: boolean
}

export interface RichTextOrderedListElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'orderedList'
}

export interface RichTextUnorderedListElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'unorderedList'
}

export interface RichTextListItemElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'listItem'
}

export interface RichTextParagraphElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'paragraph'
}

export interface RichTextScrollTargetElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'scrollTarget'
	identifier: string
}
