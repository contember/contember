declare interface Window {
	devToolsExtension?(): (args?: any) => any
}

declare interface Process {
	env: {
		NODE_ENV: 'development'
	}
}

declare const process: Process
