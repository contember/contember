import { RoutingContext, RoutingContextValue } from './RoutingContext'
import { RequestProvider } from './RequestContext'
import { ReactNode } from 'react'

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
