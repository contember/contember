import { RichTextElement } from './RichTextElement'
import { RichTextLeaf } from './RichTextLeaf'
export type BuiltinElements<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> =
	| RichTextAnchorElement<CustomElements, CustomLeaves>
	| RichTextHeadingElement<CustomElements, CustomLeaves>
	| RichTextHorizontalRuleElement<CustomElements, CustomLeaves>
	| RichTextListItemElement<CustomElements, CustomLeaves>
	| RichTextOrderedListElement<CustomElements, CustomLeaves>
	| RichTextParagraphElement<CustomElements, CustomLeaves>
	| RichTextReferenceElement<CustomElements, CustomLeaves>
	| RichTextScrollTargetElement<CustomElements, CustomLeaves>
	| RichTextTableCellElement<CustomElements, CustomLeaves>
	| RichTextTableElement<CustomElements, CustomLeaves>
	| RichTextTableRowElement<CustomElements, CustomLeaves>
	| RichTextUnorderedListElement<CustomElements, CustomLeaves>

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

export interface RichTextHorizontalRuleElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'horizontalRule'
}

export interface RichTextParagraphElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'paragraph'
	isNumbered?: boolean
}

export interface RichTextReferenceElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'reference'
	referenceId: string
}

export interface RichTextScrollTargetElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'scrollTarget'
	identifier: string
}

export interface RichTextTableElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'table'
}

export interface RichTextTableCellElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'tableCell'
	headerScope?: 'row'
	justify?: 'start' | 'center' | 'end'
}

export interface RichTextTableRowElement<
	CustomElements extends RichTextElement = never,
	CustomLeaves extends RichTextLeaf = never
> extends RichTextElement<CustomElements, CustomLeaves> {
	type: 'tableRow'
	headerScope?: 'table'
}
