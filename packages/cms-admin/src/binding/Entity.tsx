import * as React from 'react'
import { EntityName } from './bindingTypes'
import DataContext, { DataContextValue } from './DataContext'
import EntityContext, { EntityContextValue } from './EntityContext'
import FieldContext, { FieldContextValue } from './FieldContext'
import LoadingSpinner from './LoadingSpinner'

export interface EntityProps {
	name: EntityName
	loadingOverlay?: React.ComponentClass
}


export default class Entity extends React.Component<EntityProps> {

	protected fields?: FieldContextValue
	protected newContext?: EntityContextValue

	public render() {
		return <FieldContext.Consumer>
			{(fieldContext: FieldContextValue) => {
				this.fields = fieldContext
				this.newContext = (Array.isArray(fieldContext) || typeof fieldContext === 'boolean') ? {} : fieldContext

				return <EntityContext.Provider value={this.newContext}>
					<DataContext.Consumer>
						{(data: DataContextValue) => {
							if (data === undefined) {
								const LoadingOverlay = this.props.loadingOverlay || LoadingSpinner
								return <LoadingOverlay>
									{this.props.children}
								</LoadingOverlay>
							}
							return this.props.children
						}}
					</DataContext.Consumer>
				</EntityContext.Provider>
			}}
		</FieldContext.Consumer>
	}

	public componentDidMount() {
		if (this.newContext && Array.isArray(this.fields)) {
			this.fields.push(this.newContext)
		}
	}
}
