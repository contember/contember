export type DebugMethod = (...parameters: any[]) => void
export type ResultDebuggedMethod = <T>(message: string, value: T) => T

export type ScopedConsoleContextType = {
	log: DebugMethod;
	logged: ResultDebuggedMethod,
	warn: DebugMethod;
	warned: ResultDebuggedMethod,
	error: DebugMethod;
	errored: ResultDebuggedMethod,
	trace: DebugMethod;
	traced: ResultDebuggedMethod,
}
