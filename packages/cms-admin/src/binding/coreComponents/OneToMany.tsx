import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import { ReferenceMarkerProvider } from './DataMarkerProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

export interface OneToManyProps {
	field: FieldName
}

export default class OneToMany extends React.Component<OneToManyProps> {
	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[this.props.field]

						if (Array.isArray(field)) {
							return field.map((datum: DataContextValue, i: number) => {
								return (
									<DataContext.Provider value={datum} key={i}>
										{datum instanceof EntityAccessor && this.props.children}
									</DataContext.Provider>
								)
							})
						}
					}
					return this.props.children
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: OneToManyProps, referredEntity: EntityMarker): ReferenceMarker {
		return new ReferenceMarker(props.field, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof OneToMany, ReferenceMarkerProvider>
