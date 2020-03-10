import { Button, ButtonBasedButtonProps, FormGroup, Icon, IconProps } from '@contember/ui'
import * as React from 'react'
import { EntityListAccessor, useMutationState } from '@contember/binding'

export type AddNewEntityButtonProps = ButtonBasedButtonProps & {
	addNew: ((preprocess?: (getAccessor: () => EntityListAccessor, newKey: string) => void) => void) | undefined
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

export const AddNewEntityButton = React.memo(
	({ addNew, iconProps, children = 'Add', ...buttonProps }: AddNewEntityButtonProps) => {
		const isMutating = useMutationState()
		const addNewCallback = React.useCallback(() => addNew && addNew(), [addNew])

		if (!addNew) {
			return null
		}
		return (
			<FormGroup label={undefined}>
				<Button
					onClick={addNewCallback}
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
