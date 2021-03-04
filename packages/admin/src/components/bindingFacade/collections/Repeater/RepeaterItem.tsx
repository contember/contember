import { BoxSection, BoxSectionProps } from '@contember/ui'
import { ReactNode, ComponentType, ReactElement, memo, useCallback, useMemo, useRef, useState, FC, FunctionComponent, Fragment, PureComponent, useEffect } from 'react'
import { BindingError, RemovalType } from '@contember/binding'
import { DeleteEntityButton } from '../helpers'

export interface RepeaterItemProps {
	label?: ReactNode
	children: ReactNode
	canBeRemoved: boolean
	dragHandleComponent?: BoxSectionProps['dragHandleComponent']
	removalType?: RemovalType
}

export const RepeaterItem = memo(
	({ children, canBeRemoved, label, removalType, dragHandleComponent }: RepeaterItemProps) => {
		if (removalType !== 'delete') {
			throw new BindingError(
				`As a temporary limitation, <Repeater /> can currently only delete its items, not disconnect them. ` +
					`This restriction is planned to be lifted sometime in future.`,
			)
		}
		return (
			<BoxSection
				dragHandleComponent={dragHandleComponent}
				heading={label}
				actions={canBeRemoved ? <DeleteEntityButton /> : undefined}
			>
				{children}
			</BoxSection>
		)
	},
)
RepeaterItem.displayName = 'RepeaterItem'
