import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName } from '../bindingTypes'
import { EntityAccessor, EntityFields, ReferenceMarker } from '../dao'
import { DataContext, DataContextValue } from './DataContext'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface ToOneProps {
	field: FieldName
	reducedBy?: Input.UniqueWhere<GraphQlBuilder.Literal>
	filter?: Input.Where<GraphQlBuilder.Literal>
}

class ToOne extends React.Component<ToOneProps> {
	static displayName = 'ToOne'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data.getField(
							this.props.field,
							ReferenceMarker.ExpectedCount.UpToOne,
							this.props.filter,
							this.props.reducedBy
						)

						if (field instanceof EntityAccessor) {
							return <ToOne.ToOneInner accessor={field}>{this.props.children}</ToOne.ToOneInner>
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: ToOneProps, fields: EntityFields): ReferenceMarker {
		return new ReferenceMarker(props.field, ReferenceMarker.ExpectedCount.UpToOne, fields, props.filter, props.reducedBy)
	}
}

namespace ToOne {
	export interface ToOneInnerProps {
		accessor: EntityAccessor
	}

	export class ToOneInner extends React.PureComponent<ToOneInnerProps> {
		public render() {
			return <DataContext.Provider value={this.props.accessor}>{this.props.children}</DataContext.Provider>
		}
	}
}

export { ToOne }

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, ReferenceMarkerProvider>
