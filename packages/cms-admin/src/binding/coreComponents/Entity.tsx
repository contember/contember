import * as React from 'react'
import { EntityName } from '../bindingTypes'

export interface EntityProps {
	name: EntityName
}

export class Entity extends React.PureComponent<EntityProps> {
	static displayName = 'Entity'

	public render() {
		return this.props.children
	}
}
