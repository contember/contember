export enum PersistResultSuccessType {
	NothingToPersist = 'nothingToPersist',
	JustSuccess = 'justSuccess',
}

export enum PersistResultErrorType {
	Unauthorized = 'unauthorized',
	InvalidInput = 'invalidInput',
	NetworkError = 'networkError',
	UnknownError = 'unknownError',
}

export interface BaseSuccessfulPersistResult {
	type: PersistResultSuccessType
}

export interface NothingToPersistPersistResult extends BaseSuccessfulPersistResult {
	type: PersistResultSuccessType.NothingToPersist
}

export interface JustSuccessPersistResult extends BaseSuccessfulPersistResult {
	type: PersistResultSuccessType.JustSuccess
	persistedEntityId: string
}

export type SuccessfulPersistResult = NothingToPersistPersistResult | JustSuccessPersistResult

export interface BaseErrorPersistResult {
	type: PersistResultErrorType
}

export interface UnauthorizedPersistResult extends BaseErrorPersistResult {
	type: PersistResultErrorType.Unauthorized
}

export interface InvalidInputPersistResult extends BaseErrorPersistResult {
	type: PersistResultErrorType.InvalidInput
}

export interface NetworkErrorPersistResult extends BaseErrorPersistResult {
	type: PersistResultErrorType.NetworkError
}

export interface UnknownErrorPersistResult extends BaseErrorPersistResult {
	type: PersistResultErrorType.UnknownError
}

export type ErrorPersistResult =
	| UnauthorizedPersistResult
	| InvalidInputPersistResult
	| NetworkErrorPersistResult
	| UnknownErrorPersistResult

export type PersistResult = SuccessfulPersistResult | ErrorPersistResult
