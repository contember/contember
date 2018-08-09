export enum AuthStatus {
	LOGGED_IN,
	NOT_LOGGED_IN,
	LOADING
}

export default interface AuthState {
	token: string | null
	errorMessage: string | null
	status: AuthStatus
}

export const emptyAuthState: AuthState = {
	token: null,
	errorMessage: null,
	status: AuthStatus.NOT_LOGGED_IN
}
