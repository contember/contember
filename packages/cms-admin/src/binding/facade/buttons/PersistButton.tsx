import { Button, ButtonProps } from '@contember/ui'
import * as React from 'react'
import { ErrorPersistResult, useDirtinessState, useMutationState, useTriggerPersist } from '../../accessorTree'

export type PersistButtonProps = ButtonProps

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = useTriggerPersist()
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)
	const onClick = React.useCallback(() => {
		triggerPersist!()
			.catch((result: ErrorPersistResult) => {
				console.log('persist error', result)

				return Promise.reject()
			})
			.then(result => {
				console.log('persist success', result)
			})
		//buttonRef.current && buttonRef.current.blur()
	}, [triggerPersist])

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
