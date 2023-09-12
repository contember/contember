import { EntityAccessor, useEntity, useMutationState } from '@contember/binding'
import { Button, ButtonProps } from '@contember/ui'
import { Trash2Icon } from 'lucide-react'
import { ReactNode, memo, useCallback } from 'react'
import { usePersistWithFeedback } from '../../../ui'

export type DeleteEntityButtonProps =
	& {
		immediatePersist?: true
		children?: ReactNode
	}
	& ButtonProps

/**
 * Renders a button which deletes an entity in current binding context.
 *
 * @example
 * ```
 * <DeleteEntityButton />
 * ```
 *
 * @group Action buttons
 */
export const DeleteEntityButton = memo((props: DeleteEntityButtonProps) => {
	const { children, immediatePersist, ...rest } = props
	const parentEntity = useEntity()
	const triggerPersist = usePersistWithFeedback()
	const isMutating = useMutationState()
	const onClick = useCallback(() => {
		if (immediatePersist && !confirm('Really?')) {
			return
		}
		parentEntity.deleteEntity()

		if (immediatePersist && triggerPersist) {
			triggerPersist().catch(() => { })
		}
	}, [triggerPersist, immediatePersist, parentEntity])

	if (!(parentEntity instanceof EntityAccessor)) {
		return null
	}

	return (
		<Button
			square
			accent="strong"
			borderRadius="full"
			distinction="seamless"
			size="small"
			{...rest}
			intent="danger"
			disabled={isMutating || rest.disabled}
			onClick={onClick}
		>
			{children || <Trash2Icon />}
		</Button>
	)
})
DeleteEntityButton.displayName = 'DeleteEntityButton'
