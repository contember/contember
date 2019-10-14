import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { useShowToast } from '../../ui'
import { ToastType } from '../../../state/toasts'
import { ErrorPersistResult, useDirtinessState, useMutationState, useTriggerPersist } from '../../../binding/accessorTree'

export type PersistButtonProps = ButtonProps

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = useTriggerPersist()
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)
	const showToast = useShowToast()
	const onClick = React.useCallback(() => {
		if (!triggerPersist) {
			return
		}

		triggerPersist()
			.then(result => {
				showToast({
					type: ToastType.Success,
					message: 'Success!',
				})
				console.log('persist success', result)
			})
			.catch((result: ErrorPersistResult) => {
				console.log('persist error', result)
				showToast({
					type: ToastType.Error,
					message: 'Error!',
				})
			})
	}, [showToast, triggerPersist])

	const isDisabled = isMutating || !isDirty

	if (!triggerPersist) {
		return null
	}
	return (
		<Button
			intent="primary"
			onClick={onClick}
			disabled={isDisabled}
			isLoading={isMutating}
			ref={buttonRef}
			size="large"
		>
			{props.children || 'Save'}
		</Button>
	)
})
PersistButton.displayName = 'PersistButton'
