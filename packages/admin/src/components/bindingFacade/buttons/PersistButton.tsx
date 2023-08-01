import { useDirtinessState, useMutationState } from '@contember/binding'
import { useClassName } from '@contember/react-utils'
import { SaveButton, SaveButtonProps } from '@contember/ui'
import { forwardRef, memo, useCallback } from 'react'
import { usePersistWithFeedback } from '../../ui'

export type PersistButtonProps = Omit<SaveButtonProps, 'children' | 'isDirty'>

/**
 * Renders a button which triggers persist on a click.
 *
 * @example
 * ```
 * <PersistButton />
 * ```
 *
 * @group Action buttons
 */
export const PersistButton = memo(
	forwardRef<HTMLButtonElement, PersistButtonProps>((props, ref) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = usePersistWithFeedback()
	const onClick = useCallback(() => {
		triggerPersist().catch(() => {})
	}, [triggerPersist])

	const isDisabled = isMutating || !isDirty
	const className = useClassName('persist-button', props.className)

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
			className={className}
			{...props}
		/>
	)
}))
PersistButton.displayName = 'PersistButton'
