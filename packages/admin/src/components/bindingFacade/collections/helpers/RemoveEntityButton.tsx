import { Button, ButtonOwnProps, ButtonProps, Icon } from '@contember/ui'
import * as React from 'react'
import { EntityAccessor, RemovalType, useEntityAccessor, useMutationState } from '@contember/binding'
import { useTriggerPersistWithFeedback } from '../../../ui'

export type RemoveEntityButtonProps = ButtonProps & {
	removalType?: RemovalType
	immediatePersist?: true
	children?: React.ReactNode
}

export const RemoveEntityButton = React.memo((props: RemoveEntityButtonProps) => {
	const { removalType, children, immediatePersist, ...rest } = props
	const value = useEntityAccessor()
	const triggerPersist = useTriggerPersistWithFeedback()
	const isMutating = useMutationState()
	const onClick = React.useCallback(() => {
		if (!(value instanceof EntityAccessor) || !value.remove) {
			return
		}
		if (props.immediatePersist && !confirm('Really?')) {
			return
		}
		value.remove(props.removalType || 'disconnect')

		if (props.immediatePersist && triggerPersist) {
			triggerPersist().catch(() => {})
		}
	}, [triggerPersist, props.immediatePersist, props.removalType, value])

	if (!(value instanceof EntityAccessor)) {
		return null
	}

	let defaultProps: ButtonOwnProps = {
		size: 'small',
		flow: 'squarish',
		distinction: 'seamless',
		bland: true,
	}

	return (
		<Button {...defaultProps} {...rest} disabled={isMutating} onClick={onClick}>
			{children || <Icon blueprintIcon="trash" />}
		</Button>
	)
})
RemoveEntityButton.displayName = 'RemoveEntityButton'
