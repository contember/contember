import { InitSignInIDPErrorCode, SignInIDPErrorCode } from '@contember/graphql-client-tenant'

export type IDPStateValue =
	| { type: 'nothing' }
	| { type: 'processing_init' }
	| { type: 'processing_response' }
	| { type: 'success' }
	| { type: 'init_failed'; error: IDPInitError }
	| { type: 'response_failed'; error: IDPResponseError }

export type IDPStateType = IDPStateValue['type']

export type IDPInitError =
	| InitSignInIDPErrorCode
	| 'UNKNOWN_ERROR'

export type IDPResponseError =
	| SignInIDPErrorCode
	| 'INVALID_LOCAL_STATE'
	| 'UNKNOWN_ERROR'


export type IDPMethods = {
	initRedirect: (args: { provider: string }) => Promise<{ ok: true } | { ok: false; error: IDPInitError }>
}
