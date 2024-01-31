import { ComponentType, ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { ErrorPersistResult, SuccessfulPersistResult, useEntity, useMutationState, usePersist } from '@contember/react-binding'


const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

export interface DeleteEntityTriggerProps {
	immediatePersist?: true
	children: ReactNode
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

export const DeleteEntityTrigger = ({ immediatePersist, onPersistError, onPersistSuccess, ...props }: DeleteEntityTriggerProps) => {
	const parentEntity = useEntity()
	const triggerPersist = usePersist()
	const isMutating = useMutationState()
	const onClick = useCallback(() => {
		parentEntity.deleteEntity()

		if (immediatePersist) {
			triggerPersist()
				.then(onPersistSuccess)
				.catch(onPersistError)
		}
	}, [parentEntity, immediatePersist, triggerPersist, onPersistSuccess, onPersistError])

	return (
		<SlotButton
			onClick={onClick}
			disabled={isMutating ? true : undefined}
			{...props}
		/>
	)
}
