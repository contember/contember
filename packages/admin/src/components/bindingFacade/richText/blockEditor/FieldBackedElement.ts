import { SugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'

export type FieldBackedElement = {
	field: SugaredRelativeSingleField | string
	placeholder: React.ReactNode
	render: (props: { isEmpty: boolean; children: React.ReactNode }) => React.ReactNode
} & (
	| {
			format: 'richText'
			// TODO specific settings
	  }
	| {
			format: 'plainText'
	  }
)
