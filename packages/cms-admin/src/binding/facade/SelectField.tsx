import { GraphQlBuilder } from 'cms-client'
import { Input } from 'cms-common'
import * as React from 'react'
import { MarkerTreeRootProvider } from '../coreComponents/DataMarkerProvider'
import EnforceSubtypeRelation from '../coreComponents/EnforceSubtypeRelation'
import MarkerTreeRoot from '../dao/MarkerTreeRoot'

export interface SelectFieldProps {
	where?: Input.Where<GraphQlBuilder.Literal>
}

export default class SelectField extends React.Component<SelectFieldProps> {
	public static displayName = 'SelectField'

	public render() {
		return null
	}

	public static generateMarkerTreeRoot(props: SelectFieldProps, treeRoot: MarkerTreeRoot['root']): MarkerTreeRoot {
		return MarkerTreeRoot.createInstance(treeRoot, {
			where: props.where,
			whereType: 'nonUnique'
		})
	}
}

type EnforceDataBindingCompatibility = EnforceSubtypeRelation<typeof SelectField, MarkerTreeRootProvider>
