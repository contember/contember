import { ReactNode } from 'react'
import { RoutingContext } from '../contexts'
import { RequestProvider } from '../internal/components/RequestProvider'
import { RoutingContextValue } from '../types'

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
