import * as React from 'react'
import { EntityName } from '../bindingTypes'

export interface EntityProps {
	name: EntityName
}

export default class Entity extends React.Component<EntityProps> {
	static displayName = 'Entity'

	public render() {
		return this.props.children
	}
}
