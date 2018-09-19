import * as React from 'react'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import { ReferenceMarkerProvider } from '../coreComponents/MarkerProvider'
import OneToMany, { OneToManyProps } from '../coreComponents/OneToMany'
import EntityMarker from '../dao/EntityMarker'
import ReferenceMarker from '../dao/ReferenceMarker'

export interface RepeaterProps extends OneToManyProps {}

export default class Repeater extends React.Component<RepeaterProps> {
	static displayName = 'Repeater'

	public render() {
		return (
			<ul>
				<OneToMany {...this.props}>
					<li>{this.props.children}</li>
				</OneToMany>
			</ul>
		)
	}

	public static generateReferenceMarker(props: RepeaterProps, referredEntity: EntityMarker): ReferenceMarker {
		return OneToMany.generateReferenceMarker(props, referredEntity)
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof Repeater, ReferenceMarkerProvider>
