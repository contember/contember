import { Icon } from '@blueprintjs/core'
import { IconName, IconNames } from '@blueprintjs/icons'
import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { DataContext, MetaOperationsContext } from '../../coreComponents'
import { MutationStateContext } from '../../coreComponents/PersistState'
import { EntityAccessor } from '../../dao'
import { RemovalType } from '../types'

export type RemoveButtonProps = ButtonProps & {
	removeType?: RemovalType
	immediatePersist?: true
	icon?: IconName
}

export const RemoveButton = React.memo((props: RemoveButtonProps) => {
	const { removeType, icon, immediatePersist, ...rest } = props
	const value = React.useContext(DataContext)
	const metaOperations = React.useContext(MetaOperationsContext)
	const isMutating = React.useContext(MutationStateContext)
	const onClick = React.useCallback(() => {
		if (!(value instanceof EntityAccessor) || !value.remove) {
			return
		}
		if (props.immediatePersist && !confirm('Really?')) {
			return
		}
		value.remove(mapToRemovalType(props.removeType))

		if (props.immediatePersist && metaOperations) {
			setTimeout(() => metaOperations.triggerPersist(), 100) // TODO This is a *nasty* hack.
		}
	}, [metaOperations, props.immediatePersist, props.removeType, value])

	if (!(value instanceof EntityAccessor)) {
		return null
	}

	return (
		<Button onClick={onClick} disabled={isMutating} size="small" flow="squarish" distinction="seamless" {...rest}>
			<Icon icon={icon || IconNames.CROSS} color="currentColor" />
		</Button>
	)
})

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
