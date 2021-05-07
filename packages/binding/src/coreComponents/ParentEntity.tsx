import { ReactNode } from 'react'
import { MarkerFactory } from '../queryLanguage'
import { SugaredParentEntityParameters } from '../treeParameters'
import { Component } from './Component'

export interface ParentEntityProps extends SugaredParentEntityParameters {
	children?: ReactNode
}

export const ParentEntity = Component<ParentEntityProps>(
	props => <>{props.children}</>,
	{
		generateBranchMarker: (props, fields, environment) =>
			MarkerFactory.createParentEntityMarker(props, fields, environment),
	},
	'ParentEntity',
)
