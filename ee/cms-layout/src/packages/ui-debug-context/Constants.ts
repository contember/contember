import type { ScopedConsoleContextType } from './Types'

export function noopLog(...parameters: any[]) { }

export function noopLogged<T>(message: string, value: T): T {
	return value
}

export const noopScopedConsole: ScopedConsoleContextType = Object.freeze({
	log: noopLog,
	logged: noopLogged,
	warn: noopLog,
	warned: noopLogged,
	error: noopLog,
	errored: noopLogged,
	trace: noopLog,
	traced: noopLogged,
})

export function isNoopScopedConsole(value: unknown): boolean {
	return value === noopScopedConsole
}
