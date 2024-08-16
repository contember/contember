import { createContext, ReactNode, useCallback, useContext } from 'react'
import { Environment } from '@contember/binding'
import { useEnvironment } from '../accessorPropagation'

export type LabelMiddleware = (label: ReactNode, environment: Environment) => ReactNode

export const LabelMiddlewareContext = createContext<LabelMiddleware>(it => it)

export const useLabelMiddleware = () => {
	const env = useEnvironment()
	const labelMiddleware = useContext(LabelMiddlewareContext)
	return useCallback((it: ReactNode) => labelMiddleware(it, env), [env, labelMiddleware])
}

export const LabelMiddlewareProvider = ({ value, children }: { value: LabelMiddleware; children: ReactNode }) => {
	return (
		<LabelMiddlewareContext.Provider value={value}>
			{children}
		</LabelMiddlewareContext.Provider>
	)
}
