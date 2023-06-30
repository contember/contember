import { createContext, useContext } from 'react'
import { useWindowSize } from './useWindowSize'

export type ContainerWidthContextType = number
export const ContainerWidthContext = createContext<ContainerWidthContextType | null>(null)
ContainerWidthContext.displayName = 'ContainerWidthContext'

export function useContainerWidth(): number {
	const maybeContainerWidth = useContext(ContainerWidthContext)
	const { width: windowWidth } = useWindowSize()

	return maybeContainerWidth ?? windowWidth
}
