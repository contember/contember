import * as React from 'react'
import { GraphQlBuilder } from 'cms-client'
import DataContext, { DataContextValue } from './DataContext'
import EntityMarker from '../dao/EntityMarker'
import FieldContext, { FieldContextValue } from './FieldContext'
import FieldMarker from '../dao/FieldMarker'
import RootEntityMarker from '../dao/RootEntityMarker'

export interface DataProviderProps {}

export interface DataProviderState {
	data?: DataContextValue
}

export default class DataProvider extends React.Component<DataProviderProps, DataProviderState> {
	public state: DataProviderState = {
		data: undefined
	}

	protected rootContext?: RootEntityMarker

	public render() {
		this.rootContext = new RootEntityMarker()

		return (
			<FieldContext.Provider value={this.rootContext}>
				<DataContext.Provider value={this.state.data}>{this.props.children}</DataContext.Provider>
			</FieldContext.Provider>
		)
	}

	public componentDidMount() {
		console.log('The structure is', this.rootContext!.content)

		if (this.rootContext === undefined) {
			return
		}

		const entityMarker = this.rootContext.content

		if (entityMarker instanceof EntityMarker) {
			const queryBuilder = new GraphQlBuilder.QueryBuilder()
			const registerQueryPart = (
				context: FieldContextValue,
				builder: GraphQlBuilder.ObjectBuilder
			): GraphQlBuilder.ObjectBuilder => {
				if (context instanceof EntityMarker) {
					for (const field in context.fields) {
						const fieldValue: FieldContextValue = context.fields[field]

						if (fieldValue instanceof FieldMarker) {
							builder = builder.field(fieldValue.name)
						} else if (fieldValue instanceof EntityMarker) {
							builder = builder.object(field, builder => registerQueryPart(fieldValue, builder))

							if (fieldValue.where) {
								builder = builder.argument('where', fieldValue.where)
							}
						}
					}
				}

				return builder
			}

			const query = queryBuilder.query(builder =>
				builder.object(entityMarker.entityName, object => {
					if (entityMarker.where) {
						object = object.argument('where', entityMarker.where)
					}

					return registerQueryPart(entityMarker, object)
				})
			)
			console.log(query)
		}
	}
}
