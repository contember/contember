import { TreeRootAccessor } from '../accessors'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { RequestError } from './RequestError'

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
