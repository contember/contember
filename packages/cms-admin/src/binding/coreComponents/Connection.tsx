import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { FieldName, RelativeSingleField } from '../bindingTypes'
import { ConnectionMarker, Environment } from '../dao'
import { QueryLanguage } from '../queryLanguage'
import { EnforceSubtypeRelation } from './EnforceSubtypeRelation'
import { ConnectionMarkerProvider, SyntheticChildrenProvider } from './MarkerProvider'

export interface ConnectionProps {
	field: RelativeSingleField
	to: string | Input.UniqueWhere<GraphQlBuilder.Literal>
}

class Connection extends React.PureComponent<ConnectionProps> {
	public static displayName = 'Connection'

	public render() {
		return null
	}

	public static generateSyntheticChildren(props: ConnectionProps, environment: Environment) {
		return QueryLanguage.wrapRelativeSingleField(
			props.field,
			field => (
				<Connection.ConnectionGenerator
					field={field}
					to={typeof props.to === 'string' ? QueryLanguage.parseUniqueWhere(props.to, environment) : props.to}
				/>
			),
			environment
		)
	}
}

namespace Connection {
	export interface ConnectionGeneratorProps {
		field: FieldName
		to: Input.UniqueWhere<GraphQlBuilder.Literal>
	}

	export class ConnectionGenerator extends React.PureComponent<ConnectionGeneratorProps> {
		public static displayName = 'ConnectionGenerator'

		public render() {
			return null
		}
		public static generateConnectionMarker(props: ConnectionGeneratorProps) {
			return new ConnectionMarker(props.field, props.to)
		}
	}

	type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ConnectionGenerator, ConnectionMarkerProvider>
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Connection, SyntheticChildrenProvider>

export { Connection }
