import { EntityAccessor, useEntity, useMutationState } from '@contember/binding'
import { useColorScheme } from '@contember/react-utils'
import { Button, ButtonProps } from '@contember/ui'
import { colorSchemeClassName, controlsThemeClassName, listClassName } from '@contember/utilities'
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
	const { children, immediatePersist, className, ...rest } = props
	const parentEntity = useEntity()
	const triggerPersist = usePersistWithFeedback()
	const isMutating = useMutationState()
	const onClick = useCallback(() => {
		if (props.immediatePersist && !confirm('Really?')) {
			return
		}
		parentEntity.deleteEntity()

		if (props.immediatePersist && triggerPersist) {
			triggerPersist().catch(() => { })
		}
	}, [triggerPersist, props.immediatePersist, parentEntity])

	const colorScheme = useColorScheme()

	if (!(parentEntity instanceof EntityAccessor)) {
		return null
	}

	return (
		<Button
			square
			borderRadius="full"
			distinction="seamless"
			size="small"
			{...rest}
			className={listClassName([
				controlsThemeClassName('danger', ':hover'),
				colorSchemeClassName(colorScheme),
				className,
			])}
			disabled={isMutating || rest.disabled}
			onClick={onClick}
		>
			{children || <Trash2Icon />}
		</Button>
	)
})
DeleteEntityButton.displayName = 'DeleteEntityButton'
