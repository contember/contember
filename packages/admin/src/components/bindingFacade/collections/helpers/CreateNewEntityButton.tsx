import { EntityAccessor, useMutationState } from '@contember/binding'
import { Button, ButtonProps, FormGroup, Icon, IconProps } from '@contember/ui'
import { memo } from 'react'

export type CreateNewEntityButtonProps = ButtonProps & {
	createNewEntity: (initialize?: EntityAccessor.BatchUpdatesHandler) => void
	iconProps?: IconProps
}

const defaultIconProps: IconProps = {
	blueprintIcon: 'add',
	style: {
		marginRight: '0.2em',
		position: 'relative',
		top: '0.05em',
	},
}

export const CreateNewEntityButton = memo(
	({ createNewEntity, iconProps, children = 'Add', ...buttonProps }: CreateNewEntityButtonProps) => {
		const isMutating = useMutationState()

		return (
			<FormGroup label={undefined}>
				<Button
					// This looks silly but the event handler gets a different parameter than createNewEntity expects.
					onClick={() => createNewEntity()}
					disabled={isMutating}
					isLoading={isMutating}
					distinction="seamless"
					flow="block"
					justification="justifyStart"
					{...buttonProps}
				>
					<Icon {...defaultIconProps} {...iconProps} />
					{children}
				</Button>
			</FormGroup>
		)
	},
)
