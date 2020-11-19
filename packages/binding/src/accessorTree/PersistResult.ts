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
	AlreadyMutating = 'invalidInput',
}

export interface InvalidInputPersistResult {
	type: MutationErrorType.InvalidInput
}

export interface AlreadyMutating {
	type: MutationErrorType.AlreadyMutating
}

export type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult

export type ErrorPersistResult = InvalidInputPersistResult | AlreadyMutating | RequestError
