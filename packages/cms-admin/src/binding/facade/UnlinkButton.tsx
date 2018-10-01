import { Button, Intent } from '@blueprintjs/core'
import * as React from 'react'
import DataContext, { DataContextValue } from '../coreComponents/DataContext'
import EntityAccessor from '../dao/EntityAccessor'

export default class UnlinkButton extends React.Component {
	public render() {
		return (
			<DataContext.Consumer>
				{(value: DataContextValue) => {
					if (value instanceof EntityAccessor) {
						return (
							<Button icon="cross" onClick={value.unlink} intent={Intent.DANGER} small={true} />
						)
					}
				}}
			</DataContext.Consumer>
		)
	}
}
