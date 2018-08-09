import * as React from 'react'
import { FieldName } from '../bindingTypes'
import DataContext, { DataContextValue } from './DataContext'
import EntityAccessor from '../dao/EntityAccessor'
import EntityContext, { EntityContextValue } from './EntityContext'
import EntityMarker from '../dao/EntityMarker'
import FieldAccessor from '../dao/FieldAccessor'
import FieldMarker from '../dao/FieldMarker'

export interface FieldProps {
	name: FieldName
	children?: (data: FieldAccessor) => React.ReactNode
}

export default class Field extends React.Component<FieldProps> {
	protected entityContext?: EntityContextValue

	public render() {
		return (
			<EntityContext.Consumer>
				{(entityContext: EntityContextValue) => {
					this.entityContext = entityContext

					return (
						<DataContext.Consumer>
							{(data: DataContextValue) => {
								if (data instanceof EntityAccessor) {
									const fieldData = data.data[this.props.name]

									if (this.props.children && fieldData instanceof FieldAccessor) {
										return this.props.children(fieldData)
									}
								}
								return null
							}}
						</DataContext.Consumer>
					)
				}}
			</EntityContext.Consumer>
		)
	}

	public componentDidMount() {
		if (this.entityContext instanceof EntityMarker) {
			this.entityContext.fields[this.props.name] = new FieldMarker(this.props.name)
		}
	}
}
