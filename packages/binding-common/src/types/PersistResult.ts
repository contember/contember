import { ErrorAccessor } from './ErrorAccessor'
import { EntityId } from '../treeParameters'
import { DataBindingTransactionResult } from './DataBindingTransactionResult'

export interface NothingToPersistPersistResult {
	type: 'nothingToPersist'
}

export interface JustSuccessPersistResult {
	type: 'justSuccess'
	persistedEntityIds: EntityId[]
	afterPersistError?: any
}

export interface InvalidInputPersistResult {
	type: 'invalidInput'
	errors: ErrorAccessor.Error[]
	response?: DataBindingTransactionResult
}

export interface InvalidResponseResult {
	type: 'invalidResponse'
	errors: any // todo
}

export type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult

export type ErrorPersistResult = InvalidInputPersistResult  | InvalidResponseResult
