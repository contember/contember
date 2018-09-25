import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker, { ExpectedCount } from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface OneToManyProps {
	field: FieldName
}

export default class OneToMany extends React.Component<OneToManyProps> {
	static displayName = 'OneToMany'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[this.props.field]

						if (field instanceof EntityCollectionAccessor) {
							return (
								<>
									{field.entities.map(
										(datum: EntityAccessor | EntityForRemovalAccessor | undefined, i: number) =>
											datum instanceof EntityAccessor && (
												<DataContext.Provider value={datum} key={i}>
													{this.props.children}
												</DataContext.Provider>
											),
									)}
									<button type="button" onClick={field.appendNew}>
										+
									</button>
								</>
							)
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: OneToManyProps, referredEntity: EntityMarker): ReferenceMarker {
		return new ReferenceMarker(props.field, ExpectedCount.Many, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof OneToMany, ReferenceMarkerProvider>
