import * as React from 'react'
import { SortableContainer } from 'react-sortable-hoc'

export interface SortableRepeaterContainerProps {
	children: React.ReactNode
}

export const SortableRepeaterContainer = React.memo(
	SortableContainer(({ children }: SortableRepeaterContainerProps) => <>{children}</>),
)
SortableRepeaterContainer.displayName = 'SortableRepeaterContainer'
