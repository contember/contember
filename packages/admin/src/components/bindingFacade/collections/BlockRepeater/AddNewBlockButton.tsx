import { Dropdown, DropdownProps, FieldContainer, Icon } from '@contember/ui'
import { memo, useMemo } from 'react'
import { useMessageFormatter } from '../../../../i18n'
import { AddNewBlockButtonInner, AddNewBlockButtonInnerProps } from './AddNewBlockButtonInner'
import { blockRepeaterDictionary } from './Dictionary'

export interface AddNewBlockButtonProps extends Omit<AddNewBlockButtonInnerProps, 'requestClose'> {}

/**
 * @internal
 */
export const AddNewBlockButton = memo<AddNewBlockButtonProps>(props => {
	const formatter = useMessageFormatter(blockRepeaterDictionary)

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
					{props.children ?? formatter('blockRepeater.addNewBlockButton.addBlock')}
				</>
			),
			disabled: props.isMutating,
			distinction: 'seamless',
			flow: 'block',
			justification: 'justifyStart',
		}),
		[formatter, props.isMutating, props.children],
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
