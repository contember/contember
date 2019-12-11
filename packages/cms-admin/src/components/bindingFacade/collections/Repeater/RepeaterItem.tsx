import { BoxSection } from '@contember/ui'
import * as React from 'react'
import { RemovalType } from '../../../../binding'
import { RemoveEntityButton } from '../helpers'

export interface RepeaterItemProps {
	children: React.ReactNode
	canBeRemoved: boolean
	removalType?: RemovalType
}

export const RepeaterItem = React.memo(({ children, canBeRemoved, removalType }: RepeaterItemProps) => (
	<BoxSection heading={undefined} actions={canBeRemoved ? <RemoveEntityButton removalType={removalType} /> : undefined}>
		{children}
	</BoxSection>
))
RepeaterItem.displayName = 'RepeaterItem'
