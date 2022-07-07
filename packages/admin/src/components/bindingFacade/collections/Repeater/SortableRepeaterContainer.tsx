import { getPortalRoot, useComponentClassName } from '@contember/ui'
import classNames from 'classnames'
import { ReactNode } from 'react'
import { SortableContainer, SortableContainerProps } from 'react-sortable-hoc'
export interface SortableRepeaterContainerProps extends SortableContainerProps {
	children: ReactNode
}

const SortableRepeaterContainerInner = SortableContainer(({ children }: SortableRepeaterContainerProps) => <>{children}</>)

export const SortableRepeaterContainer = ({ helperClass, ...props }: SortableRepeaterContainerProps) => <SortableRepeaterContainerInner
	helperContainer={getPortalRoot}
	{...props}
	helperClass={classNames(
		helperClass,
		useComponentClassName('root-no-display'),
	)}
/>

SortableRepeaterContainer.displayName = 'SortableRepeaterContainer'
