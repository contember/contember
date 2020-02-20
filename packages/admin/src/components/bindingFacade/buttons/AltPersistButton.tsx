import { useDirtinessState, useMutationState } from '@contember/binding'
import { ButtonProps, PersistControl } from '@contember/ui'
import * as React from 'react'
import { useTriggerPersistWithFeedback } from '../../ui'

export type AltPersistButtonProps = ButtonProps

export const AltPersistButton = React.memo((props: AltPersistButtonProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = useTriggerPersistWithFeedback()
	const onClick = React.useCallback(() => {
		triggerPersist().catch(() => {})
	}, [triggerPersist])

	if (!triggerPersist) {
		return null
	}

	return <PersistControl isMutating={isMutating} isDirty={isDirty} onSave={onClick} />
})
AltPersistButton.displayName = 'AltPersistButton'
