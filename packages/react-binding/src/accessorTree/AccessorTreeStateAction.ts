import type { TreeRootAccessor } from '@contember/binding'
import type { RequestError } from '@contember/binding'
import { DataBinding } from '@contember/binding'
import { Environment } from '@contember/binding'
import { ReactNode } from 'react'

export type AccessorTreeStateAction =
	| {
			type: 'setData'
			data: TreeRootAccessor<ReactNode>
			binding: DataBinding<ReactNode>
	  }
	| {
			type: 'failWithError'
			error: RequestError
			binding: DataBinding<ReactNode>
	  }
	| {
			type: 'reset'
			binding: DataBinding<ReactNode>
			environment: Environment
	}
