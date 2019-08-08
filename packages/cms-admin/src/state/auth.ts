export enum AuthStatus {
	LOGGED_IN,
	NOT_LOGGED_IN,
	LOADING,
}

export default interface AuthState {
	identity: AuthIdentity | null
	token: string | null
	errorMessage: string | null
	status: AuthStatus
}

export interface AuthIdentity {
	token: string
	email: string
	projects: string[]
}

export const emptyAuthState: AuthState = {
	token: null,
	identity: null,
	errorMessage: null,
	status: AuthStatus.NOT_LOGGED_IN,
}
