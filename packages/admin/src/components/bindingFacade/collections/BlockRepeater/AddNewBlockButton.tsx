import { Dropdown, DropdownProps, FormGroup } from '@contember/ui'
import * as React from 'react'
import { AddNewBlockButtonInner, AddNewBlockButtonInnerProps } from './AddNewBlockButtonInner'
import { Icon } from '@contember/ui'

export interface AddNewBlockButtonProps extends Omit<AddNewBlockButtonInnerProps, 'requestClose'> {}

export const AddNewBlockButton = React.memo<AddNewBlockButtonProps>(props => {
	const buttonProps: DropdownProps['buttonProps'] = React.useMemo(
		() => ({
			children: (
				<>
					<Icon
						blueprintIcon="add"
						style={{
							marginRight: '0.2em',
							position: 'relative',
							top: '-0.071em',
						}}
					/>
					{'Add'}
				</>
			),
			disabled: props.isMutating,
			distinction: 'seamless',
			flow: 'block',
			justification: 'justifyStart',
		}),
		[props.isMutating],
	)

	return (
		<FormGroup label={undefined}>
			<Dropdown buttonProps={buttonProps} alignment="center">
				{({ requestClose, forceUpdate, update }) => (
					<AddNewBlockButtonInner
						normalizedBlocks={props.normalizedBlocks}
						createNewEntity={props.createNewEntity}
						isMutating={props.isMutating}
						discriminationField={props.discriminationField}
						requestClose={requestClose}
						forceUpdate={forceUpdate}
						update={update}
					/>
				)}
			</Dropdown>
		</FormGroup>
	)
})
AddNewBlockButton.displayName = 'AddNewBlockButton'
