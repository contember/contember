import type { RequestError } from './RequestError'

export interface NothingToPersistPersistResult {
	type: 'nothingToPersist'
}

export interface JustSuccessPersistResult {
	type: 'justSuccess'
	persistedEntityIds: string[]
	afterPersistError?: any
}

export interface InvalidInputPersistResult {
	type: 'invalidInput'
}

export interface GivenUpPersistResult {
	type: 'givenUp'
}

export type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult

export type ErrorPersistResult = InvalidInputPersistResult | GivenUpPersistResult | RequestError
