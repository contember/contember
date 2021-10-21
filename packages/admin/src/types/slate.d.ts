import { BaseEditor, Descendant } from 'slate'
import { EditorWithEssentials } from '../components'
import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

interface CustomElement {
	type: string
	children: Array<Descendant>
}

interface CustomText {
	text: string
}

declare module 'slate' {
	interface CustomTypes {
		Editor: EditorWithEssentials<ReactEditor & HistoryEditor & BaseEditor>
		Element: {
			[K in string]: unknown
		} & CustomElement
		Text: {
			[K in string]: unknown
		} & CustomText
	}
}
