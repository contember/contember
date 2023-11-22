import type { TreeRootAccessor } from '@contember/binding'
import { DataBinding, Environment } from '@contember/binding'
import { ReactNode } from 'react'
import { GraphQlClientError } from '@contember/react-client'

export type AccessorTreeStateAction =
	| {
			type: 'setData'
			data: TreeRootAccessor<ReactNode>
			binding: DataBinding<ReactNode>
	  }
	| {
			type: 'failWithError'
			error: GraphQlClientError
			binding: DataBinding<ReactNode>
	  }
	| {
			type: 'reset'
			binding: DataBinding<ReactNode>
			environment: Environment
	}
