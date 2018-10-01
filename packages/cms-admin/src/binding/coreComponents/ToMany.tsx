import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker, { ExpectedCount } from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface ToManyProps {
	field: FieldName
}

export default class ToMany extends React.Component<ToManyProps> {
	static displayName = 'ToMany'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[this.props.field]

						if (field instanceof EntityCollectionAccessor) {
							return field.entities.map(
								(datum: EntityAccessor | EntityForRemovalAccessor | undefined, i: number) =>
									datum instanceof EntityAccessor && (
										<DataContext.Provider value={datum} key={i}>
											{this.props.children}
										</DataContext.Provider>
									),
							)
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: ToManyProps, referredEntity: EntityMarker): ReferenceMarker {
		return new ReferenceMarker(props.field, ExpectedCount.Many, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, ReferenceMarkerProvider>
