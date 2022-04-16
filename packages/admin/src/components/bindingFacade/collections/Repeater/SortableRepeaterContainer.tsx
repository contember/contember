import { useComponentClassName } from '@contember/ui'
import classNames from 'classnames'
import { ReactNode } from 'react'
import { HelperContainerGetter, SortableContainer, SortableContainerProps } from 'react-sortable-hoc'
export interface SortableRepeaterContainerProps extends SortableContainerProps {
	children: ReactNode
}

const getHelperContainer: HelperContainerGetter = () => {
	return document.getElementById('portal-root') ?? document.body
}

const SortableRepeaterContainerInner = SortableContainer(({ children }: SortableRepeaterContainerProps) => <>{children}</>)

export const SortableRepeaterContainer = ({ helperClass, ...props }: SortableRepeaterContainerProps) => <SortableRepeaterContainerInner
	helperContainer={getHelperContainer}
	{...props}
	helperClass={classNames(
		helperClass,
		useComponentClassName('root-no-display'),
	)}
/>

SortableRepeaterContainer.displayName = 'SortableRepeaterContainer'
