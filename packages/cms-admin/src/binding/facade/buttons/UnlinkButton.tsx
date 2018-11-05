import { Button, Intent } from '@blueprintjs/core'
import * as React from 'react'
import { DataContext, DataContextValue } from '../../coreComponents'
import { EntityAccessor } from '../../dao'

export class UnlinkButton extends React.Component {
	public render() {
		return (
			<DataContext.Consumer>
				{(value: DataContextValue) => {
					if (value instanceof EntityAccessor) {
						return <Button icon="cross" onClick={value.unlink} intent={Intent.DANGER} small={true} />
					}
				}}
			</DataContext.Consumer>
		)
	}
}
