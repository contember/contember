import { BaseEditor, Descendant } from 'slate'
import { EditorWithEssentials, UnderlyingEditor } from '../components'

interface CustomElement {
	type: string
	children: Array<Descendant>
}

interface CustomText {
	text: string
}

declare module 'slate' {
	interface CustomTypes {
		Editor: UnderlyingEditor & BaseEditor & EditorWithEssentials<BaseEditor>
		Element: {
			[K in string]: unknown
		} & CustomElement
		Text: {
			[K in string]: unknown
		} & CustomText
	}
}
