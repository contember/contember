export enum AuthStatus {
	LOGGED_IN,
	NOT_LOGGED_IN,
}

export default interface AuthState {
	identity: AuthIdentity | null
	errorMessage: string | null
	status: AuthStatus
}

export interface AuthIdentity {
	token: string
	email: string
	personId: string
	projects: Project[]
}

export interface Project {
	slug: string
	roles: string[]
}

export const emptyAuthState: AuthState = {
	identity: null,
	errorMessage: null,
	status: AuthStatus.NOT_LOGGED_IN,
}
