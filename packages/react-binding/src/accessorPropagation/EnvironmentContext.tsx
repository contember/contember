import { ComponentType, createContext, ReactNode, useCallback, useMemo } from 'react'
import { Environment } from '@contember/binding'
import { useEnvironment } from './useEnvironment'
import { Component } from '../coreComponents'

export const EnvironmentContext = createContext<Environment>(Environment.create())
EnvironmentContext.displayName = 'EnvironmentContext'

export interface EnvironmentMiddlewareProps<T extends unknown[]> {
	children: ReactNode
	create: (env: Environment, args: T) => Environment
	args?: T
}

export const EnvironmentMiddleware = Component<EnvironmentMiddlewareProps<unknown[]>>(
	({ children, create, args }) => {
		const env = useEnvironment()
		const envWithExtension = useMemo(
			() => create(env, args ?? []),
			// eslint-disable-next-line react-hooks/exhaustive-deps
			[env, create, ...(args ?? [])],
		)

		return <EnvironmentContext.Provider value={envWithExtension}>{children}</EnvironmentContext.Provider>
	},
	{
		staticRender: ({ children }) => {
			return <>{children}</>
		},
		generateEnvironment: ({ create, args }, env) => {
			return create(env, args ?? [])
		},
	},
) as <T extends unknown[]>(props: EnvironmentMiddlewareProps<T>) => ReactNode

export interface EnvironmentWithExtensionProps<S, R> {
	children: ReactNode
	extension: Environment.Extension<S, R>
	state: S
}

export const EnvironmentExtensionProvider: <S, R>(props: EnvironmentWithExtensionProps<S, R>) => ReactNode = Component(
	({ children, extension, state }) => {
		const create = useCallback((env: Environment) => env.withExtension(extension, state), [extension, state])
		return <EnvironmentMiddleware create={create}>{children}</EnvironmentMiddleware>
	},
	({ children, extension, state }) => {
		const create = (env: Environment) => env.withExtension(extension, state)
		return <EnvironmentMiddleware create={create}>{children}</EnvironmentMiddleware>
	},
)
