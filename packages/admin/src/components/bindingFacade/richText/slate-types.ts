import { BaseEditor, Descendant } from 'slate'
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
export type EditorRenderElementProps = RenderElementProps

declare module 'slate' {
	interface CustomTypes {
		Editor: Editor
		Element: EditorElement
		Text: EditorText
	}
}
