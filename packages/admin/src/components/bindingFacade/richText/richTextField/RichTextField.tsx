import { Component, Field, FieldBasicProps, QueryLanguage, useParentEntityAccessor } from '@contember/binding'
import * as React from 'react'
import { RichTextFieldInner, RichTextFieldInnerPublicProps } from './RichTextFieldInner'

export interface RichTextFieldProps extends FieldBasicProps, RichTextFieldInnerPublicProps {}

export const RichTextField = Component<RichTextFieldProps>(
	props => {
		const entity = useParentEntityAccessor()
		const environment = entity.environment

		const desugaredField = React.useMemo(() => QueryLanguage.desugarRelativeSingleField(props, environment), [
			environment,
			props,
		])
		const fieldAccessor = React.useMemo(() => entity.getRelativeSingleField<string>(desugaredField), [
			entity,
			desugaredField,
		])

		return (
			<RichTextFieldInner
				{...props}
				environment={environment}
				batchUpdates={entity.batchUpdates}
				desugaredField={desugaredField}
				fieldAccessor={fieldAccessor}
			/>
		)
	},
	props => (
		<>
			<Field defaultValue={props.defaultValue} field={props.field} isNonbearing={props.isNonbearing} />
			{props.label}
			{props.labelDescription}
			{props.description}
		</>
	),
	'RichTextField',
)
