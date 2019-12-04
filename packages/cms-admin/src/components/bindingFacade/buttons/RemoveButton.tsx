import { Button, ButtonOwnProps, ButtonProps, Icon } from '@contember/ui'
import * as React from 'react'
import { AccessorContext, EntityAccessor, RemovalType, useMutationState } from '../../../binding'
import { useTriggerPersistWithFeedback } from '../../ui'

export type RemoveButtonProps = ButtonProps & {
	removeType?: RemovalType
	immediatePersist?: true
	children?: React.ReactNode
}

export const RemoveButton = React.memo((props: RemoveButtonProps) => {
	const { removeType, children, immediatePersist, ...rest } = props
	const value = React.useContext(AccessorContext)
	const triggerPersist = useTriggerPersistWithFeedback()
	const isMutating = useMutationState()
	const onClick = React.useCallback(() => {
		if (!(value instanceof EntityAccessor) || !value.remove) {
			return
		}
		if (props.immediatePersist && !confirm('Really?')) {
			return
		}
		value.remove(props.removeType || 'disconnect')

		if (props.immediatePersist && triggerPersist) {
			triggerPersist().catch(() => {})
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
			{children || <Icon blueprintIcon="trash" />}
		</Button>
	)
})
RemoveButton.displayName = 'RemoveButton'
