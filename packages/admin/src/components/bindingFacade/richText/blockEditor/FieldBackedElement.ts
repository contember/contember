import { FieldAccessor, RelativeSingleField, SugaredRelativeSingleField } from '@contember/binding'
import * as React from 'react'

export type FieldBackedElementEssentials = {
	placeholder: React.ReactNode
	render: (props: { children: React.ReactNode }) => React.ReactNode
} & (
	| {
			format: 'editorJSON'
			// TODO specific settings
	  }
	| {
			format: 'plainText'
	  }
)

export type FieldBackedElement = FieldBackedElementEssentials & {
	field: SugaredRelativeSingleField | string
}

export type NormalizedFieldBackedElement = FieldBackedElementEssentials & {
	field: RelativeSingleField
	accessor: FieldAccessor
}
