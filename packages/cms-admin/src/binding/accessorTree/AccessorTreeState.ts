import { AccessorTreeRoot, MarkerTreeRoot } from '../dao'
import { SuccessfulPersistResult } from './PersistResult'
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

			// This is really a no-op but we want to avoid having to un-render all e.g. persist buttons
			triggerPersist: () => Promise<SuccessfulPersistResult>
	  } & AccessorTreeGlobalState)
	| ({
			name: AccessorTreeStateName.Interactive
			data: AccessorTreeRoot
			triggerPersist: () => Promise<SuccessfulPersistResult>
	  } & AccessorTreeGlobalState)

export type AccessorTreeGlobalStateById = {
	[Id in MarkerTreeRoot.TreeId]: AccessorTreeGlobalState
}
