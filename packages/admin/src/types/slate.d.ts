import { BaseEditor, Descendant } from 'slate'
import { EditorWithEssentials, UnderlyingEditor } from '../components'
import { ReactNode } from 'react'

interface CustomElement {
	type?: string
	referenceId?: string
	children: Array<Descendant>
	placeholder?: ReactNode
	headerScope?: 'table' | 'row' | null
	justify?: 'start' | 'center' | 'end' | null
}
interface CustomText {
	text: string
}

declare module 'slate' {
	interface CustomTypes {
		Editor: UnderlyingEditor & BaseEditor & EditorWithEssentials<BaseEditor>
		Element: CustomElement
		Text: {
			[K in string]: unknown
		} & CustomText
	}
}
