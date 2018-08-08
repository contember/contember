import * as React from 'react'
import { GraphQlBuilder } from 'cms-client'
import DataContext, { DataContextValue } from './DataContext'
import FieldContext, { FieldContextValue } from './FieldContext'

export interface DataProviderProps {}

export interface DataProviderState {
	data?: DataContextValue
}

export default class DataProvider extends React.Component<DataProviderProps, DataProviderState> {
	public state: DataProviderState = {
		data: undefined
	}

	protected rootContext?: FieldContextValue

	public render() {
		this.rootContext = {}

		return (
			<FieldContext.Provider value={this.rootContext}>
				<DataContext.Provider value={this.state.data}>{this.props.children}</DataContext.Provider>
			</FieldContext.Provider>
		)
	}

	public componentDidMount() {
		console.log('The structure is', this.rootContext)

		const rootContext = this.rootContext

		if (rootContext !== undefined) {
			const queryBuilder = new GraphQlBuilder.QueryBuilder()
			const registerQueryPart = (context: FieldContextValue, builder: GraphQlBuilder.ObjectBuilder): GraphQlBuilder.ObjectBuilder => {
				if (Array.isArray(context)) {
					for (const item of context) {
						builder = registerQueryPart(item, builder)
					}
				} else if (typeof context === 'object') {
					for (const field in context) {
						if (typeof context[field] === 'boolean') {
							builder = builder.field(field)
						} else {
							const fieldValue = context[field]

							if (fieldValue !== undefined) {
								builder = builder.object(field, builder =>
									registerQueryPart(fieldValue, builder)
								)
							}
						}
					}
				}

				return builder
			}

			const query = queryBuilder.query(builder =>
				builder.object('Post', (object) => {
					// builder.argument()

					return registerQueryPart(rootContext, object)
				})
			)
			console.log(query)
		}
	}
}
