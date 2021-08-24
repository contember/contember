import { createContext, useContext } from 'react'
import { RouteMap } from '../components/pageRouting/utils'
import { SelectedDimension } from '../state/request'

export interface RoutingContextValue {
	basePath: string
	routes: RouteMap
	defaultDimensions?: SelectedDimension
}

export const RoutingContext = createContext<RoutingContextValue>({
	basePath: '',
	routes: {},
})

export const useRouting = () => useContext(RoutingContext)
