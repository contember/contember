import { getPortalRoot } from '@contember/ui'
import { useClassName } from '@contember/utilities'
import { ReactNode } from 'react'
import { SortableContainer, SortableContainerProps } from 'react-sortable-hoc'
export interface SortableRepeaterContainerProps extends SortableContainerProps {
	children: ReactNode
}

const SortableRepeaterContainerInner = SortableContainer(({ children }: SortableRepeaterContainerProps) => <>{children}</>)

export const SortableRepeaterContainer = ({ helperClass, ...props }: SortableRepeaterContainerProps) => <SortableRepeaterContainerInner
	helperContainer={getPortalRoot}
	{...props}
	helperClass={useClassName('root-no-display', helperClass)}
/>

SortableRepeaterContainer.displayName = 'SortableRepeaterContainer'
