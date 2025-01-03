import { ComponentType, ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { useDecoratedPersist } from './persist/useDecoratedPersist'
import { ErrorPersistResult, SuccessfulPersistResult } from '@contember/binding'
import { useEntity } from '../accessorPropagation'
import { useMutationState } from '../accessorTree'


const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

export interface DeleteEntityTriggerProps {
	immediatePersist?: boolean
	children: ReactNode
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
}

export const DeleteEntityTrigger = ({ immediatePersist, onPersistError, onPersistSuccess, ...props }: DeleteEntityTriggerProps) => {
	const parentEntity = useEntity()
	const triggerPersist = useDecoratedPersist({ onPersistError, onPersistSuccess })
	const isMutating = useMutationState()
	const onClick = useCallback(() => {
		parentEntity.deleteEntity()

		if (immediatePersist) {
			triggerPersist()
		}
	}, [parentEntity, immediatePersist, triggerPersist])

	return (
		<SlotButton
			onClick={onClick}
			disabled={isMutating ? true : undefined}
			{...props}
		/>
	)
}
