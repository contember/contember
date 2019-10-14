import { Dropdown } from '@contember/ui'
import * as React from 'react'
import { AddNewBlockButtonInner, AddNewBlockButtonInnerProps } from './AddNewBlockButtonInner'

export interface AddNewBlockButtonProps extends Omit<AddNewBlockButtonInnerProps, 'requestClose'> {}

export const AddNewBlockButton = React.memo<AddNewBlockButtonProps>(props => {
	return (
		<div className="cloneable-button">
			<Dropdown
				buttonProps={{
					children: '+ Add new',
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
		</div>
	)
})
AddNewBlockButton.displayName = 'AddNewBlockButton'
