import { Button, Intent } from '@blueprintjs/core'
import * as React from 'react'
import EntityCollectionAccessor from '../../dao/EntityCollectionAccessor'

interface AddNewButtonProps {
	addNew: EntityCollectionAccessor['addNew']
}

export default class AddNewButton extends React.Component<AddNewButtonProps> {
	public render() {
		return (
			this.props.addNew && (
				<Button icon="plus" onClick={this.props.addNew} intent={Intent.PRIMARY}>
					Add new
				</Button>
			)
		)
	}
}
