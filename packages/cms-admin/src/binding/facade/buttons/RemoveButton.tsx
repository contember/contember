import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import * as React from 'react'
import { Button, ButtonProps } from '../../../components'
import { DataContext, MetaOperationsContext, MetaOperationsContextValue } from '../../coreComponents'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { EntityAccessor } from '../../dao'
import { RemovalType } from '../types'

export interface RemoveButtonProps extends ButtonProps {
	removeType?: RemovalType
	immediatePersist?: true
	icon?: IconName
}

export const RemoveButton = React.memo((props: RemoveButtonProps) => {
	const { removeType, icon, immediatePersist, ...rest } = props
	const value = React.useContext(DataContext)
	const metaOperations = React.useContext(MetaOperationsContext)
	const isMutating = React.useContext(MutationStateContext)

	if (value instanceof EntityAccessor) {
		return (
			<Button {...rest} onClick={getOnClick(props, value, metaOperations)} disabled={isMutating} small minimal>
				<Icon icon={icon || IconNames.CROSS} color="currentColor" />
			</Button>
		)
	}
	return null
})

const getOnClick = (
	props: RemoveButtonProps,
	entityAccessor: EntityAccessor,
	metaOperations: MetaOperationsContextValue
) => () => {
	if (!entityAccessor.remove) {
		return
	}
	if (props.immediatePersist && !confirm('Really?')) {
		return
	}

	entityAccessor.remove(mapToRemovalType(props.removeType))

	if (props.immediatePersist && metaOperations) {
		metaOperations.triggerPersist()
	}
}

const mapToRemovalType = (removalType?: RemovalType): EntityAccessor.RemovalType => {
	switch (removalType) {
		case 'disconnect':
			return EntityAccessor.RemovalType.Disconnect
		case 'delete':
			return EntityAccessor.RemovalType.Delete
		default:
			// By default, we just unlink unless explicitly told to actually delete
			return EntityAccessor.RemovalType.Disconnect
	}
}
