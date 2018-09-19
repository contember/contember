import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { EntityName } from '../bindingTypes'
import EntityMarker, { EntityFields } from '../dao/EntityMarker'
import { EntityMarkerProvider } from './MarkerProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

export interface EntityProps {
	name: EntityName
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class Entity extends React.Component<EntityProps> {
	static displayName = 'Entity'

	public render() {
		return this.props.children
	}

	static generateEntityMarker(props: EntityProps, childrenFields: EntityFields): EntityMarker {
		return new EntityMarker(props.name, childrenFields, props.where)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Entity, EntityMarkerProvider>
