import { SugarableRelativeSingleField } from '@contember/react-binding'
import { EditorCanvasDistinction, Size } from '@contember/ui'
import { ReactNode } from 'react'

export interface RichTextFieldBackedElement {
	field: string | SugarableRelativeSingleField
	placeholder: string
	format: 'richText'
	distinction?: EditorCanvasDistinction
}

export interface PlainTextFieldBackedElement {
	field: string | SugarableRelativeSingleField
	placeholder: string
	format: 'plainText'
	distinction?: EditorCanvasDistinction
	size?: Size
}

export interface CustomFieldBackedElement {
	element: ReactNode
}

export type FieldBackedElement =
	| RichTextFieldBackedElement
	| PlainTextFieldBackedElement
	| CustomFieldBackedElement
