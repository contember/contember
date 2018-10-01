import { Button, Intent } from '@blueprintjs/core'
import * as React from 'react'
import MetaOperationsContext, { MetaOperationsContextValue } from '../coreComponents/MetaOperationsContext'

export default class PersistButton extends React.Component {
	public render() {
		return (
			<MetaOperationsContext.Consumer>
				{(value: MetaOperationsContextValue) => {
					if (value) {
						return (
							<Button icon="floppy-disk" onClick={value.triggerPersist} intent={Intent.SUCCESS} large={true}>
								Save!
							</Button>
						)
					}
				}}
			</MetaOperationsContext.Consumer>
		)
	}
}
