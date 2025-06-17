export interface SessionTokenContextValue {
	propsToken: string | undefined
	source: 'props' | 'localstorage' | undefined
	token: string | undefined
}
