import * as React from 'react'
import { FieldName } from '../bindingTypes'
import EntityAccessor from '../dao/EntityAccessor'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker from '../dao/ReferenceMarker'
import DataContext, { DataContextValue } from './DataContext'
import { ReferenceMarkerProvider } from './DataMarkerProvider'
import EnforceSubtypeRelation from './EnforceSubtypeRelation'

export interface OneToOneProps {
	field: FieldName
	children: React.ReactNode | ((unlink?: () => void) => React.ReactNode)
}

export default class OneToOne extends React.Component<OneToOneProps> {
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

	public static generateReferenceMarker(props: OneToOneProps, referredEntity: EntityMarker): ReferenceMarker {
		return new ReferenceMarker(props.field, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof OneToOne, ReferenceMarkerProvider>
