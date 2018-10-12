declare interface Window {
	devToolsExtension?(): (args?: any) => any
}

declare interface Process {
	env: any
}

declare var process: Process
