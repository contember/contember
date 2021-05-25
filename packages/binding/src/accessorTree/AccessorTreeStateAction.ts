import type { TreeRootAccessor } from '../accessors'
import type { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import type { RequestError } from './RequestError'

export type AccessorTreeStateAction =
	| {
			type: AccessorTreeStateActionType.SetData
			data: TreeRootAccessor
	  }
	| {
			type: AccessorTreeStateActionType.FailWithError
			error: RequestError
	  }
	| {
			type: AccessorTreeStateActionType.Reset
	  }
