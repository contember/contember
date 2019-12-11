import { BoxSection } from '@contember/ui'
import * as React from 'react'
import { RemovalType } from '../../../../binding'
import { RemoveEntityButton } from '../helpers'

export interface RepeaterItemProps {
	label?: React.ReactNode
	children: React.ReactNode
	canBeRemoved: boolean
	dragHandleComponent?: React.ComponentType
	removalType?: RemovalType
}

export const RepeaterItem = React.memo(
	({ children, canBeRemoved, label, removalType, dragHandleComponent: Handle }: RepeaterItemProps) => (
		<BoxSection
			heading={
				!!(label || Handle) && (
					<>
						{Handle && <Handle />}
						{label}
					</>
				)
			}
			actions={canBeRemoved ? <RemoveEntityButton removalType={removalType} /> : undefined}
		>
			{children}
		</BoxSection>
	),
)
RepeaterItem.displayName = 'RepeaterItem'
