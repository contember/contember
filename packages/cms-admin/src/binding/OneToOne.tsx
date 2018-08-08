import * as React from 'react'
import { FieldName } from './bindingTypes'
import DataContext, { DataContextValue } from './DataContext'
import EntityAccessor from './EntityAccessor'
import { EntityContextValue } from './EntityContext'
import OneToRelation from './OneToRelation'

export interface OneToOneProps {
	field: FieldName
	children: React.ReactNode | ((unlink?: () => void) => React.ReactNode)
}


export default class OneToOne extends React.Component<OneToOneProps> {

	public render() {
		return <OneToRelation field={this.props.field} setNewEntityContext={this.setNewEntityContent}>
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[this.props.field]

						if (!Array.isArray(field) && field instanceof EntityAccessor) {
							return <DataContext.Provider value={field}>
								{this.renderChildren(field.unlink)}
							</DataContext.Provider>
						}
					}
					return this.renderChildren()
				}}
			</DataContext.Consumer>
		</OneToRelation>
	}


	protected renderChildren(unlink?: () => void): React.ReactNode {
		if (typeof this.props.children === 'function') {
			return this.props.children(unlink)
		}
		return this.props.children
	}

	protected setNewEntityContent = (entityContext: EntityContextValue, newFieldContext: EntityContextValue[]) => {
		if (newFieldContext.length === 1) {
			entityContext[this.props.field] = newFieldContext[0]
		}
	}
}
