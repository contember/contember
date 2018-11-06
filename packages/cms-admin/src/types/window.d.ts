declare interface Window {
	devToolsExtension?(): (args?: any) => any
}

declare interface Process {
	env: {
		NODE_ENV: 'development'
		SERVER_URL: string
		LOGIN_TOKEN: string
	}
}

declare const process: Process
