import * as React from 'react'
import { Field, FieldPublicProps, Props } from '../../coreComponents'
import { Environment } from '../../dao'
import { QueryLanguage } from '../../queryLanguage'
import { Component } from './Component'

export const SimpleRelativeSingleField = function<P extends FieldPublicProps>(
	render: React.FunctionComponent<P>,
	displayName: string,
) {
	return Component<P>(
		render,
		(props: Props<P>, environment: Environment) =>
			QueryLanguage.wrapRelativeSingleField(
				props.name,
				fieldName => (
					<Field
						defaultValue={
							props.defaultValue === undefined
								? render.defaultProps
									? render.defaultProps.defaultValue
									: undefined
								: props.defaultValue
						}
						name={fieldName}
					/>
				),
				environment,
			),
		displayName,
	)
}
