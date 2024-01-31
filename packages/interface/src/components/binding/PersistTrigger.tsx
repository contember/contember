import { ErrorPersistResult, SuccessfulPersistResult, useDirtinessState, useMutationState, usePersist } from '@contember/react-binding'
import { ComponentType, ReactElement, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { dataAttribute } from '@contember/utilities'

const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

export interface PersistTriggerProps {
	children: ReactElement
	onSuccess?: (result: SuccessfulPersistResult) => void
	onError?: (result: ErrorPersistResult) => void
}

export const PersistTrigger = ({ onError, onSuccess, ...props }: PersistTriggerProps) => {
	const isMutating = useMutationState()
	const isDirty = useDirtinessState()
	const triggerPersist = usePersist()
	const onClick = useCallback(() => {
		triggerPersist()
			.then(onSuccess)
			.catch(onError)
	}, [onError, onSuccess, triggerPersist])

	const isDisabled = isMutating || !isDirty

	return (
		<SlotButton
			disabled={isDisabled}
			data-dirty={dataAttribute(isDirty)}
			data-loading={dataAttribute(isMutating)}
			onClick={onClick}
			{...props}
		/>
	)
}
