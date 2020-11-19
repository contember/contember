import { GetEntityByKey, TreeRootAccessor } from '../accessors'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { SuccessfulPersistResult } from './PersistResult'
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
