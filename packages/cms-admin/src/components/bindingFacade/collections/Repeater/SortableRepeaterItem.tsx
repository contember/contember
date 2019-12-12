import * as React from 'react'
import { SortableElement } from 'react-sortable-hoc'

export interface SortableRepeaterItemProps {
	children: React.ReactNode
}

export const SortableRepeaterItem = React.memo(
	SortableElement(({ children }: SortableRepeaterItemProps) => <>{children}</>),
)
SortableRepeaterItem.displayName = 'SortableRepeaterItem'
