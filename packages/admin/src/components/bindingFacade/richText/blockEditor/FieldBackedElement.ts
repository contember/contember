import { SugarableRelativeSingleField } from '@contember/binding'
import { EditorCanvasDistinction, Size } from '@contember/ui'
import { ReactNode } from 'react'

interface RichTextFieldBackedElement {
	field: string | SugarableRelativeSingleField
	placeholder: string
	format: 'richText'
	distinction?: EditorCanvasDistinction
}

interface PlainTextFieldBackedElement {
	field: string | SugarableRelativeSingleField
	placeholder: string
	format: 'plainText'
	distinction?: EditorCanvasDistinction
	size?: Size
}

interface CustomFieldBackedElement {
	element: ReactNode
}

export type FieldBackedElement =
	| RichTextFieldBackedElement
	| PlainTextFieldBackedElement
	| CustomFieldBackedElement
