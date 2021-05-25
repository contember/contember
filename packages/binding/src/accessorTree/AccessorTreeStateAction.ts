import type { TreeRootAccessor } from '../accessors'
import type { RequestError } from './RequestError'

export type AccessorTreeStateAction =
	| {
			type: 'setData'
			data: TreeRootAccessor
	  }
	| {
			type: 'failWithError'
			error: RequestError
	  }
	| {
			type: 'reset'
	  }
