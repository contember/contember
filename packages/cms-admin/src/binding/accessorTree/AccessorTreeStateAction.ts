import { AccessorTreeRoot } from '../accessors'
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
			data: AccessorTreeRoot
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
