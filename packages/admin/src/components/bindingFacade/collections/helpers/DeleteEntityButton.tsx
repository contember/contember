import { Button, ButtonOwnProps, ButtonProps, Icon } from '@contember/ui'
import * as React from 'react'
import { EntityAccessor, useEntity, useMutationState } from '@contember/binding'
import { useTriggerPersistWithFeedback } from '../../../ui'

export type DeleteEntityButtonProps = ButtonProps & {
	immediatePersist?: true
	children?: React.ReactNode
}

export const DeleteEntityButton = React.memo((props: DeleteEntityButtonProps) => {
	const { children, immediatePersist, ...rest } = props
	const parentEntity = useEntity()
	const triggerPersist = useTriggerPersistWithFeedback()
	const isMutating = useMutationState()
	const onClick = React.useCallback(() => {
		if (!parentEntity.deleteEntity) {
			return
		}
		if (props.immediatePersist && !confirm('Really?')) {
			return
		}
		parentEntity.deleteEntity()

		if (props.immediatePersist && triggerPersist) {
			triggerPersist().catch(() => {})
		}
	}, [triggerPersist, props.immediatePersist, parentEntity])

	if (!(parentEntity instanceof EntityAccessor)) {
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
DeleteEntityButton.displayName = 'DeleteEntityButton'
