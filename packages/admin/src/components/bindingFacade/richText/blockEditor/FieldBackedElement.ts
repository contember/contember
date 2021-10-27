import { SugarableRelativeSingleField } from '@contember/binding'
import type { ReactNode } from 'react'
import { Size } from '@contember/ui'

export type FieldBackedElement = {
	field: string | SugarableRelativeSingleField
	placeholder: string

	/** @deprecated */
	render: (props: { isEmpty: boolean; children: ReactNode }) => ReactNode
} & (
	| {
			format: 'richText'
			// TODO specific settings
	  }
	| {
			format: 'plainText'
			size?: Size
	  }
)
