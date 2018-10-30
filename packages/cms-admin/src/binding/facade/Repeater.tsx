import { Button } from '@blueprintjs/core'
import * as React from 'react'
import DataContext, { DataContextValue } from '../coreComponents/DataContext'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from '../coreComponents/MarkerProvider'
import ToMany, { ToManyProps } from '../coreComponents/ToMany'
import EntityAccessor from '../dao/EntityAccessor'
import EntityCollectionAccessor from '../dao/EntityCollectionAccessor'
import EntityFields from '../dao/EntityFields'
import EntityForRemovalAccessor from '../dao/EntityForRemovalAccessor'
import ReferenceMarker from '../dao/ReferenceMarker'
import UnlinkButton from './buttons/UnlinkButton'

export interface RepeaterProps extends ToManyProps {}

export default class Repeater extends React.Component<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<DataContext.Consumer>
				{(data: DataContextValue) => {
					if (data instanceof EntityAccessor) {
						const field = data.data.getField(
							this.props.field,
							ReferenceMarker.ExpectedCount.PossiblyMany,
							this.props.where
						)

						if (field instanceof EntityCollectionAccessor) {
							return (
								<>
									{field.entities.map(
										(datum: EntityAccessor | EntityForRemovalAccessor | undefined, i: number) =>
											datum instanceof EntityAccessor && (
												<DataContext.Provider value={datum} key={i}>
													{this.props.children}
													<UnlinkButton />
												</DataContext.Provider>
											)
									)}
									<Button icon="plus" onClick={field.appendNew}>
										Add new
									</Button>
								</>
							)
						}
					}
				}}
			</DataContext.Consumer>
		)
	}

	public static generateReferenceMarker(props: RepeaterProps, fields: EntityFields): ReferenceMarker {
		return ToMany.generateReferenceMarker(props, fields)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, ReferenceMarkerProvider>
