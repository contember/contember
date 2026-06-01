import { ReactNode } from 'react'
import { RoutingContext } from '../contexts.js'
import { RequestProvider } from '../internal/components/RequestProvider.js'
import { RoutingContextValue } from '../types/index.js'

export type RoutingProviderProps =
	& Partial<RoutingContextValue>
	& {
		children: ReactNode
	}

export const RoutingProvider = ({ children, ...props }: RoutingProviderProps) => {
	return (
		<RoutingContext.Provider value={{ routes: {}, basePath: '/', ...props }}>
			<RequestProvider>
				{children}
			</RequestProvider>
		</RoutingContext.Provider>
	)
}
