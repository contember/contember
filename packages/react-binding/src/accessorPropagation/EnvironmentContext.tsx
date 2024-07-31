import { createContext, ReactNode, useCallback, useMemo } from 'react'
import { Environment } from '@contember/binding'
import { useEnvironment } from './useEnvironment'
import { Component } from '../coreComponents'

export const EnvironmentContext = createContext<Environment>(Environment.create())
EnvironmentContext.displayName = 'EnvironmentContext'

export interface EnvironmentMiddlewareProps {
	children: ReactNode
	create: (env: Environment) => Environment
}

export const EnvironmentMiddleware = Component(
	({ children, create }: EnvironmentMiddlewareProps) => {
		const env = useEnvironment()
		const envWithExtension = useMemo(() => create(env), [env, create])

		return <EnvironmentContext.Provider value={envWithExtension}>{children}</EnvironmentContext.Provider>
	},
	{
		staticRender: ({ children }) => {
			return <>{children}</>
		},
		generateEnvironment: ({ create }, env) => {
			return create(env)
		},
	},
)

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
