import { AccessorTreeRoot, MarkerTreeRoot, MetaOperationsAccessor } from '../dao'
import { RequestError } from './RequestError'

export enum AccessorTreeStateName {
	Uninitialized = 'uninitialized',
	Querying = 'querying',
	RequestError = 'requestError',
	Interactive = 'ready',
	Mutating = 'mutating',
}

export interface AccessorTreeGlobalState {
	isDirty: boolean
}

export type AccessorTreeState =
	| {
			name: AccessorTreeStateName.Uninitialized
	  }
	| {
			name: AccessorTreeStateName.Querying
	  }
	| {
			name: AccessorTreeStateName.RequestError
			error: RequestError
	  }
	| ({
			name: AccessorTreeStateName.Mutating
			data: AccessorTreeRoot

			// This will really just no-ops but we want to avoid having to un-render all e.g. persist buttons
			metaOperations: MetaOperationsAccessor
	  } & AccessorTreeGlobalState)
	| ({
			name: AccessorTreeStateName.Interactive
			data: AccessorTreeRoot
			metaOperations: MetaOperationsAccessor
	  } & AccessorTreeGlobalState)

export type AccessorTreeGlobalStateById = {
	[Id in MarkerTreeRoot.TreeId]: AccessorTreeGlobalState
}
