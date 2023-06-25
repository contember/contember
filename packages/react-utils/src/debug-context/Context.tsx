import { assert, isNonEmptyString } from '@contember/utilities'
import { ReactNode, createContext, memo, useContext, useMemo, useRef } from 'react'
import { isNoopScopedConsole, noopScopedConsole } from './Constants'
import { ScopedConsoleContextType } from './Types'

function createPrefixedConsole(message: string, prefixedConsole?: ScopedConsoleContextType): ScopedConsoleContextType {
	return {
		error: function error(...parameters: any[]) {
			(prefixedConsole ?? console).error(message, ...parameters)
		},
		errored: function errored<T>(message: string, value: T): T {
			(prefixedConsole ?? console).error(message, value)
			return value
		},
		log: function log(...parameters: any[]) {
			(prefixedConsole ?? console).log(message, ...parameters)
		},
		logged: function logged<T>(message: string, value: T): T {
			(prefixedConsole ?? console).log(message, value)
			return value
		},
		trace: function trace(...parameters: any[]) {
			(prefixedConsole ?? console).trace(message, ...parameters)
		},
		traced: function traced<T>(message: string, value: T): T {
			(prefixedConsole ?? console).trace(message, value)
			return value
		},
		warn: function warn(...parameters: any[]) {
			(prefixedConsole ?? console).warn(message, ...parameters)
		},
		warned: function warned<T>(message: string, value: T): T {
			(prefixedConsole ?? console).warn(message, value)
			return value
		},
	}
}

export const ScopedConsoleContext = createContext<ScopedConsoleContextType>(null!)
ScopedConsoleContext.displayName = 'ScopedConsoleContext'

function parentScopedConsoleOrNone(parentConsole: ScopedConsoleContextType): ScopedConsoleContextType | undefined {
	return isNoopScopedConsole(parentConsole) ? undefined : parentConsole
}

export const useScopedConsoleRef = (prefix: string, override?: boolean) => {
	assert('prefix is non-empty string', prefix, isNonEmptyString)

	const parentConsole = parentScopedConsoleOrNone(useContext(ScopedConsoleContext))

	const scopedConsole = useMemo(() => {
		if (override !== false && (parentConsole || override)) {
			return createPrefixedConsole(prefix, parentConsole)
		} else {
			return noopScopedConsole
		}
	}, [override, parentConsole, prefix])

	const ref = useRef(scopedConsole)
	ref.current = scopedConsole

	return ref
}

export type DebugChildrenProps =
	| { active?: true; children: ReactNode; id: string }
	| { active?: false; children: ReactNode; id?: string }

export const DebugChildren = memo<DebugChildrenProps>(({ active = true, children, id }) => {
	const parentScopedConsole = parentScopedConsoleOrNone(useContext(ScopedConsoleContext))

	const console = active && id
		? createPrefixedConsole(id, parentScopedConsole)
		: noopScopedConsole

	return (
		<ScopedConsoleContext.Provider value={active ? console : noopScopedConsole}>
			{children}
		</ScopedConsoleContext.Provider>
	)
})
DebugChildren.displayName = 'DebugChildren'
