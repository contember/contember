import * as React from 'react'
import { FieldName } from '../bindingTypes'
import DataContext, { DataContextValue } from './DataContext'
import EntityAccessor from '../dao/EntityAccessor'
import OneToRelation from './OneToRelation'

export interface OneToManyProps {
	field: FieldName
	children: (unlink?: () => void) => React.ReactNode
}

export default class OneToMany extends React.Component<OneToManyProps> {
	public render() {
		return (
			<OneToRelation field={this.props.field}>
				<DataContext.Consumer>
					{(data: DataContextValue) => {
						if (data instanceof EntityAccessor) {
							const field = data.data[this.props.field]

							if (Array.isArray(field)) {
								return field.map((datum: DataContextValue, i: number) => {
									return (
										<DataContext.Provider value={datum} key={i}>
											{datum instanceof EntityAccessor && this.props.children(datum.unlink)}
										</DataContext.Provider>
									)
								})
							}
						}
						return this.props.children(() => undefined)
					}}
				</DataContext.Consumer>
			</OneToRelation>
		)
	}
}
