import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityFields from '../dao/EntityFields'
import ReferenceMarker from '../dao/ReferenceMarker'
import PlaceholderGenerator from '../model/PlaceholderGenerator'
import DataContext, { DataContextValue } from './DataContext'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface ToOneProps {
	field: FieldName
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class ToOne extends React.Component<ToOneProps> {
	static displayName = 'ToOne'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[PlaceholderGenerator.getReferencePlaceholder(this.props.field, this.props.where)]

						if (field instanceof EntityAccessor) {
							return <DataContext.Provider value={field}>{this.props.children}</DataContext.Provider>
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: ToOneProps, fields: EntityFields): ReferenceMarker {
		return new ReferenceMarker(props.field, ReferenceMarker.ExpectedCount.One, fields, props.where)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, ReferenceMarkerProvider>
