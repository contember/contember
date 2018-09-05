import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import EntityMarker from '../dao/EntityMarker'
import EntityTreeToQueryConverter from '../model/EntityTreeToQueryConverter'
import DataProvider from './DataProvider'

interface SingleEntityDataProviderProps {
	where: Input.UniqueWhere<GraphQlBuilder.Literal>
}

export default class SingleEntityDataProvider extends React.Component<SingleEntityDataProviderProps> {
	private generateQuery = (rootMarker?: EntityMarker) => {
		if (!rootMarker) {
			return undefined
		}
		const converter = new EntityTreeToQueryConverter(rootMarker)
		return converter.convertToGetQuery(this.props.where)
	}

	public render() {
		return <DataProvider generateReadQuery={this.generateQuery}>{this.props.children}</DataProvider>
	}
}
