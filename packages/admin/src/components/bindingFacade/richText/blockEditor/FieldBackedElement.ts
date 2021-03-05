import { SugaredRelativeSingleField } from '@contember/binding'
import { ReactNode } from 'react'

export type FieldBackedElement = {
	field: SugaredRelativeSingleField | string
	placeholder: ReactNode
	render: (props: { isEmpty: boolean; children: ReactNode }) => ReactNode
} & (
	| {
			format: 'richText'
			// TODO specific settings
	  }
	| {
			format: 'plainText'
	  }
)
