import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { createComponentOpenHooks } from '../utils/createComponentOpenHooks'

export const {
	Component: Collapsible,
	useOpen: useCollapsibleOpenState,
} = createComponentOpenHooks(CollapsiblePrimitive.Root)

export const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

export const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent
