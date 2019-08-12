import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { RelativeSingleField, Scalar } from '../../bindingTypes'
import { useEntityContext, useEnvironment } from '../../coreComponents'
import { Parser } from '../../queryLanguage'
import { getNestedField } from './getNestedField'

export const useRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	field: RelativeSingleField,
) => {
	const entity = useEntityContext()
	const environment = useEnvironment()
	return React.useMemo(() => {
		const { fieldName, toOneProps } = Parser.parseQueryLanguageExpression(
			field,
			Parser.EntryPoint.RelativeSingleField,
			environment,
		)
		return getNestedField<Persisted, Produced>(entity, toOneProps, fieldName)
	}, [entity, environment, field])
}
