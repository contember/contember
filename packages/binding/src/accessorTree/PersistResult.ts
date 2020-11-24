import { RequestError } from './RequestError'

export enum PersistResultSuccessType {
	NothingToPersist = 'nothingToPersist',
	JustSuccess = 'justSuccess',
}

export interface NothingToPersistPersistResult {
	type: PersistResultSuccessType.NothingToPersist
}

export interface JustSuccessPersistResult {
	type: PersistResultSuccessType.JustSuccess
	persistedEntityIds: string[]
}

export enum MutationErrorType {
	InvalidInput = 'invalidInput',
}

export interface InvalidInputPersistResult {
	type: MutationErrorType.InvalidInput
}

export type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult

export type ErrorPersistResult = InvalidInputPersistResult | RequestError
