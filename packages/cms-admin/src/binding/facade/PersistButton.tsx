import * as React from 'react'
import MetaOperationsContext, { MetaOperationsContextValue } from '../coreComponents/MetaOperationsContext'

export default class PersistButton extends React.Component {
	public render() {
		return (
			<MetaOperationsContext.Consumer>
				{(value: MetaOperationsContextValue) => {
					if (value) {
						return (
							<button type="button" onClick={value.triggerPersist}>
								Save!
							</button>
						)
					}
				}}
			</MetaOperationsContext.Consumer>
		)
	}
}
