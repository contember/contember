import { FormGroupProps } from '@contember/ui'
import * as React from 'react'
import {
	DataBindingError,
	FieldAccessor,
	FieldMetadata,
	FieldPublicProps,
	getNestedEntity,
	Parser,
	useEntityContext,
	useEnvironment,
	useMutationState,
} from '../../../../binding'
import { SimpleRelativeSingleFieldInner } from './SimpleRelativeSingleFieldInner'

export type SimpleRelativeSingleFieldProxyProps = FieldPublicProps &
	Omit<FormGroupProps, 'children'> & {
		render: undefined | ((fieldMetadata: FieldMetadata<any, any>, props: any) => React.ReactNode)
	}

export const SimpleRelativeSingleFieldProxy = React.memo((props: SimpleRelativeSingleFieldProxyProps) => {
	const immediateParentEntity = useEntityContext()
	const environment = useEnvironment()
	const isMutating = useMutationState()
	const expression = React.useMemo(
		() => Parser.parseQueryLanguageExpression(props.name, Parser.EntryPoint.RelativeSingleField, environment),
		[environment, props.name],
	)
	const nestedEntity = getNestedEntity(immediateParentEntity, expression.toOneProps)
	const field = nestedEntity.data.getField(expression.fieldName)

	if (!(field instanceof FieldAccessor)) {
		throw new DataBindingError(`Corrupted data`)
	}

	const fieldMetadata: FieldMetadata = React.useMemo(
		() => ({
			errors: field.errors,
			data: field,
			fieldName: expression.fieldName,
			environment,
			isMutating,
		}),
		[environment, expression.fieldName, field, isMutating],
	)

	return (
		<SimpleRelativeSingleFieldInner
			{...props}
			fieldMetadata={fieldMetadata}
			immediateParentEntity={immediateParentEntity}
		/>
	)
})
SimpleRelativeSingleFieldProxy.displayName = 'SimpleRelativeSingleFieldProxy'
