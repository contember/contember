import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker, { ExpectedCount } from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from './MarkerProvider'

export interface ToOneProps {
	field: FieldName
	children: React.ReactNode | ((unlink?: () => void) => React.ReactNode)
}

export default class ToOne extends React.Component<ToOneProps> {
	static displayName = 'OneToOne'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data[this.props.field]

						if (field instanceof EntityAccessor) {
							return <DataContext.Provider value={field}>{this.props.children}</DataContext.Provider>
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: ToOneProps, referredEntity: EntityMarker): ReferenceMarker {
		return new ReferenceMarker(props.field, ExpectedCount.One, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof ToOne, ReferenceMarkerProvider>
