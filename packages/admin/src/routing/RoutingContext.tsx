import { createContext, useContext } from 'react'
import { RouteMap } from '../components/pageRouting/utils'
import { SelectedDimension } from './types'

export interface RoutingContextValue {
	basePath: string
	routes: RouteMap
	defaultDimensions?: SelectedDimension
}

export const RoutingContext = createContext<RoutingContextValue>({ basePath: '/', routes: {} })
RoutingContext.displayName = 'RoutingContext'

export const useRouting = () => useContext(RoutingContext)
