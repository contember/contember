import { GetEntityByKey, RootAccessor } from '../accessors'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { SuccessfulPersistResult } from './PersistResult'
import { RequestError } from './RequestError'

export type AccessorTreeStateAction =
	| {
			type: AccessorTreeStateActionType.Uninitialize
	  }
	| {
			type: AccessorTreeStateActionType.SetDirtiness
			isDirty: boolean
	  }
	| {
			type: AccessorTreeStateActionType.SetData
			data: RootAccessor
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
