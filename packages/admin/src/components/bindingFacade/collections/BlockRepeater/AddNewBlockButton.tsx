import { Dropdown, DropdownProps, FieldContainer, Icon } from '@contember/ui'
import { memo, useMemo } from 'react'
import { AddNewBlockButtonInner, AddNewBlockButtonInnerProps } from './AddNewBlockButtonInner'

export interface AddNewBlockButtonProps extends Omit<AddNewBlockButtonInnerProps, 'requestClose'> {}

export const AddNewBlockButton = memo<AddNewBlockButtonProps>(props => {
	const buttonProps: DropdownProps['buttonProps'] = useMemo(
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
		<FieldContainer label={undefined}>
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
		</FieldContainer>
	)
})
AddNewBlockButton.displayName = 'AddNewBlockButton'
