import { BoxSection, BoxSectionProps } from '@contember/ui'
import * as React from 'react'
import { RemovalType } from '../../../../binding'
import { RemoveEntityButton } from '../helpers'

export interface RepeaterItemProps {
	label?: React.ReactNode
	children: React.ReactNode
	canBeRemoved: boolean
	dragHandleComponent?: BoxSectionProps['dragHandleComponent']
	removalType?: RemovalType
}

export const RepeaterItem = React.memo(
	({ children, canBeRemoved, label, removalType, dragHandleComponent }: RepeaterItemProps) => (
		<BoxSection
			dragHandleComponent={dragHandleComponent}
			heading={label}
			actions={canBeRemoved ? <RemoveEntityButton removalType={removalType} /> : undefined}
		>
			{children}
		</BoxSection>
	),
)
RepeaterItem.displayName = 'RepeaterItem'
