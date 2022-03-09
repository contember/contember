import { createContext, useContext } from 'react'
import { noop } from '../../utils'

interface ExpandParentContextProps {
  expandParent: () => void,
  parentIsExpanded: boolean,
}

export const ExpandParentContext = createContext<ExpandParentContextProps>({
  expandParent: noop,
  parentIsExpanded: true,
})

export function useExpandParentContext() {
  return useContext(ExpandParentContext)
}

export const DepthContext = createContext(0)

export const FocusableContext = createContext<{
	nextFocusable: () => HTMLLIElement | null
	previousFocusable: () => HTMLLIElement | null
}>({
	nextFocusable: () => null,
	previousFocusable: () => null,
})

export function useFocusableContext() {
	return useContext(FocusableContext)
}
