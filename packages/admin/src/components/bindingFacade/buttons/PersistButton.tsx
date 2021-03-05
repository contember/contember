import { Button, ButtonProps, FormGroup } from '@contember/ui'
import { memo, useRef, useCallback, useMemo } from 'react'
import { useDirtinessState, useMutationState } from '@contember/binding'
import { usePersistWithFeedback } from '../../ui'

export type PersistButtonProps = ButtonProps

export const PersistButton = memo((props: PersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = usePersistWithFeedback()
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const onClick = useCallback(() => {
		triggerPersist().catch(() => {})
	}, [triggerPersist])

	const isDisabled = isMutating || !isDirty

	const message = useMemo(
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
