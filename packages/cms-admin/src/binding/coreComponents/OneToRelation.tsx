import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityMarker from '../dao/EntityMarker'
import RootEntityMarker from '../dao/RootEntityMarker'
import EntityContext, { EntityContextValue } from './EntityContext'
import FieldContext from './FieldContext'

export interface OneToRelationProps {
	field: FieldName
}

export default class OneToRelation extends React.Component<OneToRelationProps> {
	protected entityContext?: EntityContextValue
	protected newFieldContext?: RootEntityMarker

	public render() {
		return (
			<EntityContext.Consumer>
				{(entityContext: EntityContextValue) => {
					this.entityContext = entityContext
					this.newFieldContext = new RootEntityMarker()

					return <FieldContext.Provider value={this.newFieldContext}>{this.props.children}</FieldContext.Provider>
				}}
			</EntityContext.Consumer>
		)
	}

	public componentDidMount() {
		if (this.entityContext instanceof EntityMarker && this.newFieldContext) {
			this.entityContext.fields[this.props.field] = this.newFieldContext.content
		} /* else if (DEBUG) {
			throw new Error
		}*/
	}
}
