import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityFields from '../dao/EntityFields'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import ReferenceMarker from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface ToManyProps {
	field: FieldName
	where?: Input.Where<GraphQlBuilder.Literal>
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

	public static generateReferenceMarker(props: ToManyProps, fields: EntityFields): ReferenceMarker {
		return new ReferenceMarker(props.field, ReferenceMarker.ExpectedCount.Many, fields, props.where)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToMany, ReferenceMarkerProvider>
