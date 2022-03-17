import type { RequestError } from './RequestError'
import { ErrorAccessor } from '../accessors'
import { EntityId } from '../treeParameters'

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
}

export interface InvalidResponseResult {
	type: 'invalidResponse'
	errors: any // todo
}

export interface GivenUpPersistResult {
	type: 'givenUp'
}

export type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult

export type ErrorPersistResult = InvalidInputPersistResult | GivenUpPersistResult | RequestError | InvalidResponseResult
