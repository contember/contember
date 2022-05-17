import { useDirtinessState, useMutationState } from '@contember/binding'
import { SaveButton, SaveButtonProps } from '@contember/ui'
import { forwardRef, memo, useCallback } from 'react'
import { usePersistWithFeedback } from '../../ui'

export type PersistButtonProps = Omit<SaveButtonProps, 'children' | 'isDirty'> & {
}

export const PersistButton = memo(
	forwardRef<HTMLButtonElement, PersistButtonProps>((props, ref) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = usePersistWithFeedback()
	const onClick = useCallback(() => {
		triggerPersist().catch(() => {})
	}, [triggerPersist])

	const isDisabled = isMutating || !isDirty

	if (!triggerPersist) {
		return null
	}
	return (
		<SaveButton
			ref={ref}
			disabled={isDisabled}
			intent={isDisabled ? 'default' : props.intent}
			isDirty={isDirty}
			loading={isMutating}
			onClick={onClick}
			size="large"
			{...props}
		/>
	)
}))
PersistButton.displayName = 'PersistButton'
