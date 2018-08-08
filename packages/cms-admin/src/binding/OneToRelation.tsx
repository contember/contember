import * as React from 'react'
import { FieldName } from './bindingTypes'
import EntityContext, { EntityContextValue } from './EntityContext'
import FieldContext from './FieldContext'

export interface OneToRelationProps {
	field: FieldName
	setNewEntityContext: (entityContext: EntityContextValue, newFieldContext: EntityContextValue[]) => void
}


export default class OneToRelation extends React.Component<OneToRelationProps> {

	protected entityContext?: EntityContextValue
	protected newFieldContext?: EntityContextValue[]

	public render() {
		return <EntityContext.Consumer>
			{(entityContext: EntityContextValue) => {
				this.entityContext = entityContext
				this.newFieldContext = []

				return <FieldContext.Provider value={this.newFieldContext}>
					{this.props.children}
				</FieldContext.Provider>
			}}
		</EntityContext.Consumer>
	}

	public componentDidMount() {
		if (this.entityContext && this.newFieldContext) {
			this.props.setNewEntityContext(this.entityContext, this.newFieldContext)
		} /* else if (DEBUG) {
			throw new Error
		}*/
	}
}
