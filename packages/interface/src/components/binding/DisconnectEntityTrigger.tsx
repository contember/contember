import { ComponentType, ReactNode, useCallback } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { BindingError, EntityListAccessor, ErrorPersistResult, SuccessfulPersistResult, SugaredRelativeSingleEntity, useEntity, useMutationState, usePersist } from '@contember/react-binding'


const SlotButton = Slot as ComponentType<React.ButtonHTMLAttributes<HTMLButtonElement>>

export interface DisconnectEntityTriggerProps {
	immediatePersist?: true
	children: ReactNode
	onPersistSuccess?: (result: SuccessfulPersistResult) => void
	onPersistError?: (result: ErrorPersistResult) => void
	field?: SugaredRelativeSingleEntity['field']
}

export const DisconnectEntityTrigger = ({ immediatePersist, onPersistError, onPersistSuccess, field, ...props }: DisconnectEntityTriggerProps) => {
	const entity = useEntity()
	const triggerPersist = usePersist()
	const isMutating = useMutationState()
	const onClick = useCallback(() => {
		if (field) {
			entity.disconnectEntityAtField({ field })
		} else {
			const parent = entity.getParent()
			if (!parent) {
				throw new BindingError('Cannot disconnect root entity')
			}
			if (parent instanceof EntityListAccessor) {
				parent.disconnectEntity(entity)
			} else {
				const subTreeNode = entity.environment.getSubTreeNode()
				if (subTreeNode.type !== 'entity') {
					throw new BindingError('Cannot disconnect root entity')
				}
				parent.disconnectEntityAtField({ field: subTreeNode.field.name })
			}
		}

		if (immediatePersist) {
			triggerPersist()
				.then(onPersistSuccess)
				.catch(onPersistError)
		}
	}, [field, immediatePersist, entity, triggerPersist, onPersistSuccess, onPersistError])

	return (
		<SlotButton
			onClick={onClick}
			disabled={isMutating ? true : undefined}
			{...props}
		/>
	)
}
