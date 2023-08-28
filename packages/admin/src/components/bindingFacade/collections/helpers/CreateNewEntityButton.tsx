import { EntityAccessor, useMutationState } from '@contember/binding'
import { useClassName } from '@contember/react-utils'
import { Button, ButtonProps, IconProps, Text } from '@contember/ui'
import { PlusCircleIcon } from 'lucide-react'
import { ComponentType, ReactNode, memo } from 'react'

export type CreateNewEntityButtonProps = ButtonProps & {
	createNewEntity: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	iconProps?: IconProps
}

export interface AddEntityButtonProps {
	addButtonText?: ReactNode
	addButtonProps?: CreateNewEntityButtonProps // Children here override 'addButtonText'
	addButtonComponent?: ComponentType<CreateNewEntityButtonProps & any> // This can override 'addButtonText' and 'addButtonProps'
	addButtonComponentExtraProps?: {}
}

export interface SelectEntityButtonProps {
	selectButtonText?: ReactNode
	selectButtonProps?: CreateNewEntityButtonProps // Children here override 'updateButtonText'
	selectButtonComponent?: ComponentType<CreateNewEntityButtonProps & any> // This can override 'updateButtonText' and 'updateButtonProps'
	selectButtonComponentExtraProps?: {}
}

export const CreateNewEntityButton = memo(
	({ createNewEntity, iconProps, children = 'Add', ...buttonProps }: CreateNewEntityButtonProps) => {
		const isMutating = useMutationState()

		return (
			<Button
				// This looks silly but the event handler gets a different parameter than createNewEntity expects.
				onClick={() => createNewEntity()}
				disabled={isMutating}
				loading={isMutating}
				className={useClassName('new-entity-button')}
				distinction="seamless"
				justify="start"
				padding="gap"
				{...buttonProps}
			>
				<PlusCircleIcon />
				{typeof children === 'string' || typeof children === 'number'
					? <Text>{children}</Text>
					: children}
			</Button>
		)
	},
)
