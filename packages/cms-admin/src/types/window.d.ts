declare interface Window {
	devToolsExtension?(): (args?: any) => any
}

declare interface Process {
	env: {
		NODE_ENV: 'development' | 'production'
	}
}

declare const process: Process
