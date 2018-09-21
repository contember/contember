import * as React from 'react'
import { FieldName } from '../bindingTypes'
import DataBindingError from '../dao/DataBindingError'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import { ReferenceMarkerProvider } from './MarkerProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

export interface OneToManyProps {
	field: FieldName
}

export default class OneToMany extends React.Component<OneToManyProps> {
	static displayName = 'OneToMany'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[this.props.field]

						if (field instanceof EntityCollectionAccessor) {
							return field.entities.map((datum: EntityAccessor | undefined, i: number) => (
								datum && <DataContext.Provider value={datum} key={i}>
									{this.props.children}
								</DataContext.Provider>
							))
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: OneToManyProps, referredEntity: EntityMarker): ReferenceMarker {
		return new ReferenceMarker(props.field, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof OneToMany, ReferenceMarkerProvider>
