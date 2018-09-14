import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import EntityMarker from '../dao/EntityMarker'
import EntityTreeToQueryConverter from '../model/EntityTreeToQueryConverter'
import DataProvider from './DataProvider'

interface EntityListDataProviderProps {
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class EntityListDataProvider extends React.Component<EntityListDataProviderProps> {
	private generateReadQuery = (rootMarker?: EntityMarker) => {
		if (!rootMarker) {
			return undefined
		}
		const converter = new EntityTreeToQueryConverter(rootMarker)
		const query = converter.convertToListQuery(this.props.where)

		console.log('q', query)

		return query
	}

	public render() {
		return <DataProvider generateReadQuery={this.generateReadQuery}>{this.props.children}</DataProvider>
	}
}
