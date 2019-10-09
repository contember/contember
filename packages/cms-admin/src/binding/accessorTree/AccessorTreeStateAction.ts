import { AccessorTreeRoot, MetaOperationsAccessor } from '../dao'
import { AccessorTreeStateActionType } from './AccessorTreeStateActionType'
import { RequestError } from './RequestError'

export type AccessorTreeStateAction =
	| {
			type: AccessorTreeStateActionType.SetDirtiness
			isDirty: boolean
	  }
	| {
			type: AccessorTreeStateActionType.SetData
			data: AccessorTreeRoot
			metaOperations?: MetaOperationsAccessor
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
