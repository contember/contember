import { Button, ButtonProps, FormGroup } from '@contember/ui'
import * as React from 'react'
import { ErrorPersistResult, useDirtinessState, useMutationState, useTriggerPersist } from '../../../binding'
import { ToastType } from '../../../state/toasts'
import { useShowToastWithTimeout } from '../../ui'

export type PersistButtonProps = ButtonProps

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = useTriggerPersist()
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)
	const showToast = useShowToastWithTimeout()
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

	const message = React.useMemo(
		() => (
			<div style={{ textAlign: 'center' }}>
				{!isDirty ? 'There is nothing to submit.' : isMutating ? 'Submitting…' : 'There are unsaved changes.'}
			</div>
		),
		[isDirty, isMutating],
	)

	if (!triggerPersist) {
		return null
	}
	return (
		<FormGroup label={undefined} size="large" description={message}>
			<Button
				intent={isDisabled ? 'default' : 'primary'}
				onClick={onClick}
				disabled={isDisabled}
				isLoading={isMutating}
				ref={buttonRef}
				size="large"
				flow="block"
			>
				{props.children || 'Save'}
			</Button>
		</FormGroup>
	)
})
PersistButton.displayName = 'PersistButton'
