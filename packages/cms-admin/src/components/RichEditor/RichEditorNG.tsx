import { EntityCollectionAccessor, Environment } from '../../binding/dao'
import { QueryLanguage } from '../../binding/queryLanguage'
import { EnvironmentContext, Field, Props, ToMany } from '../../binding'
import * as React from 'react'
import { Sortable } from '../../binding/facade/collections/Sortable'
import { KeyUtils } from 'slate'
import { InnerEditor, RTEProps } from './ng/InnerEditor'

export function generateUuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		const r = (Math.random() * 16) | 0
		const v = c == 'x' ? r : (r & 0x3) | 0x8
		return v.toString(16)
	})
}

KeyUtils.setGenerator(
	(): string => {
		return generateUuid()
	}
)

export class RichEditorNG extends React.PureComponent<RTEProps> {
	render() {
		return (
			<EnvironmentContext.Consumer>
				{(environment: Environment) => {
					return QueryLanguage.wrapRelativeEntityList(
						this.props.field,
						atomicPrimitiveProps => {
							return (
								<ToMany.AccessorRetriever {...atomicPrimitiveProps}>
									{(accessor: EntityCollectionAccessor) => <InnerEditor {...this.props} accessor={accessor} />}
								</ToMany.AccessorRetriever>
							)
						},
						environment
					)
				}}
			</EnvironmentContext.Consumer>
		)
	}

	public static generateSyntheticChildren(props: Props<RTEProps>, environment: Environment): React.ReactNode {
		const fields = Object.values(props.blocks).map((definition, i) => {
			if (definition.renderBlock !== undefined) {
				return QueryLanguage.wrapRelativeSingleField(
					definition.valueField,
					fieldName => <Field name={fieldName} />,
					environment
				)
			} else {
				return <React.Fragment key={i}>{definition.render}</React.Fragment>
			}
		})

		return (
			<ToMany field={props.field}>
				<Field name={Sortable.resolveSortByFieldName(props.sortBy, environment)} isNonbearing={true} />
				{QueryLanguage.wrapRelativeSingleField(
					props.name,
					fieldName => (
						<Field name={fieldName} />
					),
					environment
				)}
				{fields}
			</ToMany>
		)
	}
}
