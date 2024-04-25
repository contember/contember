import { BaseEditor, Descendant, Selection, Point, Range, Ancestor, Path } from 'slate'
import { EditorWithEssentials } from './baseEditor'
import { ReactEditor, RenderElementProps } from 'slate-react'
import { HistoryEditor } from 'slate-history'

export type Editor = EditorWithEssentials<ReactEditor & HistoryEditor & BaseEditor>
export type EditorElement = {
	[K in string]: unknown
} & {
	type: string
	children: Array<Descendant>
}
export type EditorText = {
	[K in string]: unknown
} & {
	text: string
}

export type EditorDescendant = Descendant
export type EditorAncestor = Ancestor
export type EditorSelection = Selection
export type EditorRange = Range
export type EditorPath = Path
export type EditorPoint = Point
export type EditorRenderElementProps = RenderElementProps

declare module 'slate' {
	interface CustomTypes {
		Editor: Editor
		Element: EditorElement
		Text: EditorText
	}
}
