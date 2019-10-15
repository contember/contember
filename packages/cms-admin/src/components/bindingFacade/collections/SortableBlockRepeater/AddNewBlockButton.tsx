import { Icon } from '@blueprintjs/core'
import { IconNames } from '@blueprintjs/icons'
import { Dropdown, FormGroup } from '@contember/ui'
import * as React from 'react'
import { AddNewBlockButtonInner, AddNewBlockButtonInnerProps } from './AddNewBlockButtonInner'

export interface AddNewBlockButtonProps extends Omit<AddNewBlockButtonInnerProps, 'requestClose'> {}

export const AddNewBlockButton = React.memo<AddNewBlockButtonProps>(props => {
	return (
		<FormGroup label={undefined}>
			<Dropdown
				buttonProps={{
					children: (
						<>
							<Icon
								icon={IconNames.ADD}
								style={{
									marginRight: '0.2em',
									position: 'relative',
									top: '0.05em',
								}}
							/>
							{'Add'}
						</>
					),
					disabled: props.isMutating,
					distinction: 'seamless',
					flow: 'block',
				}}
			>
				{({ requestClose }) => (
					<AddNewBlockButtonInner
						normalizedBlockProps={props.normalizedBlockProps}
						addNew={props.addNew}
						isMutating={props.isMutating}
						discriminationField={props.discriminationField}
						requestClose={requestClose}
					/>
				)}
			</Dropdown>
		</FormGroup>
	)
})
AddNewBlockButton.displayName = 'AddNewBlockButton'
