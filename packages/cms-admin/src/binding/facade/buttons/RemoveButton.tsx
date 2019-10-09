import { IconName } from '@blueprintjs/icons'
import { Button, ButtonOwnProps, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { useMutationState, useTriggerPersist } from '../../accessorTree'
import { AccessorContext } from '../../coreComponents'
import { EntityAccessor } from '../../dao'
import { RemovalType } from '../types'

export type RemoveButtonProps = ButtonProps & {
	removeType?: RemovalType
	immediatePersist?: true
	icon?: IconName
	children?: React.ReactNode
}

export const RemoveButton = React.memo((props: RemoveButtonProps) => {
	const { removeType, icon, children, immediatePersist, ...rest } = props
	const value = React.useContext(AccessorContext)
	const triggerPersist = useTriggerPersist()
	const isMutating = useMutationState()
	const onClick = React.useCallback(() => {
		if (!(value instanceof EntityAccessor) || !value.remove) {
			return
		}
		if (props.immediatePersist && !confirm('Really?')) {
			return
		}
		value.remove(mapToRemovalType(props.removeType))

		if (props.immediatePersist && triggerPersist) {
			setTimeout(() => triggerPersist(), 100) // TODO This is a *nasty* hack.
		}
	}, [triggerPersist, props.immediatePersist, props.removeType, value])

	if (!(value instanceof EntityAccessor)) {
		return null
	}

	let defaultProps: ButtonOwnProps = {}
	if (!children) {
		defaultProps = {
			size: 'small',
			flow: 'squarish',
			distinction: 'seamless',
			bland: true,
		}
	}

	return (
		<Button {...defaultProps} {...rest} disabled={isMutating} onClick={onClick}>
			{children || (
				<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
					<path
						fill="currentColor"
						d="M9 19c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm4 0c0 .552-.448 1-1 1s-1-.448-1-1v-10c0-.552.448-1 1-1s1 .448 1 1v10zm5-17v2h-20v-2h5.711c.9 0 1.631-1.099 1.631-2h5.315c0 .901.73 2 1.631 2h5.712zm-3 4v16h-14v-16h-2v18h18v-18h-2z"
					/>
				</svg>
			)}
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
