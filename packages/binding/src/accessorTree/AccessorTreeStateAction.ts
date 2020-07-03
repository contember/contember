import { GetEntityByKey, TreeRootAccessor } from '../accessors'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { SuccessfulPersistResult } from './PersistResult'
import { RequestError } from './RequestError'

export type AccessorTreeStateAction =
	| {
			type: AccessorTreeStateActionType.Uninitialize
	  }
	| {
			type: AccessorTreeStateActionType.SetData
			data: TreeRootAccessor
			getEntityByKey?: GetEntityByKey
			triggerPersist: () => Promise<SuccessfulPersistResult>
	  }
	| {
			type: AccessorTreeStateActionType.InitializeQuery
	  }
	| {
			type: AccessorTreeStateActionType.ResolveRequestWithError
			error: RequestError
	  }
	| {
			type: AccessorTreeStateActionType.InitializeMutation
	  }
