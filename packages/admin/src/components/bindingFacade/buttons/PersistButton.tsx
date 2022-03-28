import { useDirtinessState, useMutationState } from '@contember/binding'
import { SaveButton, SaveButtonProps } from '@contember/ui'
import { memo, useCallback, useRef } from 'react'
import { usePersistWithFeedback } from '../../ui'

export type PersistButtonProps = Omit<SaveButtonProps, 'children' | 'isDirty'> & {
}

export const PersistButton = memo((props: PersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = usePersistWithFeedback()
	const buttonRef = useRef<HTMLButtonElement | null>(null)
	const onClick = useCallback(() => {
		triggerPersist().catch(() => {})
	}, [triggerPersist])

	const isDisabled = isMutating || !isDirty

	if (!triggerPersist) {
		return null
	}
	return (
		<SaveButton
			ref={buttonRef}
			disabled={isDisabled}
			flow="block"
			intent={isDisabled ? 'default' : 'primary'}
			isDirty={isDirty}
			isLoading={isMutating}
			onClick={onClick}
			size="large"
			{...props}
		/>
	)
})
PersistButton.displayName = 'PersistButton'
