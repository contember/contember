import { Button, ButtonProps, FormGroup } from '@contember/ui'
import * as React from 'react'
import { useDirtinessState, useMutationState } from '@contember/binding'
import { usePersistWithFeedback } from '../../ui'

export type PersistButtonProps = ButtonProps

export const PersistButton = React.memo((props: PersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = usePersistWithFeedback()
	const buttonRef = React.useRef<HTMLButtonElement | null>(null)
	const onClick = React.useCallback(() => {
		triggerPersist().catch(() => {})
	}, [triggerPersist])

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
