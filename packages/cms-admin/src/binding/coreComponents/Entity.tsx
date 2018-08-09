import * as React from 'react'
import { EntityName } from '../bindingTypes'
import DataContext, { DataContextValue } from './DataContext'
import EntityContext, { EntityContextValue } from './EntityContext'
import EntityMarker from '../dao/EntityMarker'
import FieldContext, { FieldContextValue } from './FieldContext'
import LoadingSpinner from './LoadingSpinner'
import RootEntityMarker from '../dao/RootEntityMarker'

export interface EntityProps {
	name: EntityName
	loadingOverlay?: React.ComponentClass
	where?: any
}

export default class Entity extends React.Component<EntityProps> {
	protected fields?: FieldContextValue
	protected newContext?: EntityContextValue

	public render() {
		return (
			<FieldContext.Consumer>
				{(fieldContext: FieldContextValue) => {
					this.fields = fieldContext
					this.newContext =
						fieldContext instanceof EntityMarker
							? fieldContext
							: new EntityMarker(this.props.name, {}, this.props.where)

					return (
						<EntityContext.Provider value={this.newContext}>
							<DataContext.Consumer>
								{(data: DataContextValue) => {
									if (data === undefined) {
										const LoadingOverlay = this.props.loadingOverlay || LoadingSpinner
										return <LoadingOverlay>{this.props.children}</LoadingOverlay>
									}
									return this.props.children
								}}
							</DataContext.Consumer>
						</EntityContext.Provider>
					)
				}}
			</FieldContext.Consumer>
		)
	}

	public componentDidMount() {
		if (this.newContext) {
			if (Array.isArray(this.fields)) {
				this.fields.push(this.newContext)
			} else if (this.fields instanceof RootEntityMarker) {
				this.fields.content = this.newContext
			}
		}
	}
}
