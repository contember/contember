import * as React from 'react'
import RootEntityMarker from '../dao/RootEntityMarker'
import { AccessorTreeGenerator, TreeToQueryConverter } from '../model'
import PersistQueryGenerator from '../model/PersistQueryGenerator'
import DataContext, { DataContextValue } from './DataContext'
import FieldContext from './FieldContext'

export interface DataProviderProps {
	children: (persist: () => void) => React.ReactNode
}

export interface DataProviderState {
	data?: DataContextValue
}

export default class DataProvider extends React.Component<DataProviderProps, DataProviderState> {
	public state: DataProviderState = {
		data: undefined
	}

	protected rootContext?: RootEntityMarker

	protected persistedData?: object

	protected triggerPersist = () => {
		if (this.persistedData && this.rootContext) {
			const generator = new PersistQueryGenerator(this.persistedData, this.rootContext)

			console.log(generator.generatePersistQuery())
		}
	}

	public render() {
		this.rootContext = new RootEntityMarker()

		return (
			<FieldContext.Provider value={this.rootContext}>
				<DataContext.Provider value={this.state.data}>{this.props.children(this.triggerPersist)}</DataContext.Provider>
			</FieldContext.Provider>
		)
	}

	public componentDidMount() {
		console.log('The structure is', this.rootContext!.content)

		if (this.rootContext === undefined) {
			return
		}

		const converter = new TreeToQueryConverter(this.rootContext)

		console.log(converter.convert())

		this.persistedData = {
			Post: {
				id: '1011c518-de96-4cd7-99a6-ee262e85d148',
				publishedAt: 'Fri Aug 10 2018 09:47:04 GMT+0200 (Central European Summer Time)',
				author: {
					id: 'ceb000df-94fd-4a7e-88f1-15c3be1f2a80',
					name: 'author 1'
				},
				categories: [
					{
						id: '3408a11a-3b52-4ee7-a274-f16af574f76a',
						locales: [
							{
								id: 'a6a387a0-363e-4128-be48-c2e26bec2a9b',
								name: 'category - 3'
							},
							{
								id: '223e3379-7ec7-443e-8e50-3bb6cf54b28d',
								name: 'kategorie - 8'
							}
						]
					}
				],
				locales: [
					{
						id: 'd75576c5-5be0-41e8-b5e8-d403ada4c9b7',
						title: 'post - 1'
					},
					{
						id: 'f809e03a-40bb-4140-b951-ff8b319cf588',
						title: 'článek - 11'
					}
				]
			}
		}

		new AccessorTreeGenerator(this.rootContext, this.persistedData, newData => this.setState({ data: newData }))
	}
}
