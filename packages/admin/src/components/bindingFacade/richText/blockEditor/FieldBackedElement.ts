import { SugarableRelativeSingleField } from '@contember/binding'
import { Size } from '@contember/ui'
import { ReactNode } from 'react'

interface RichTextFieldBackedElement {
	field: string | SugarableRelativeSingleField
	placeholder: string
	format: 'richText'
}

interface PlainTextFieldBackedElement {
	field: string | SugarableRelativeSingleField
	placeholder: string
	format: 'plainText'
	size?: Size
}

interface CustomFieldBackedElement {
	element: ReactNode
}

export type FieldBackedElement =
	| RichTextFieldBackedElement
	| PlainTextFieldBackedElement
	| CustomFieldBackedElement
