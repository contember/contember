import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { RelativeSingleField } from '../bindingTypes'
import { useEnvironment } from '../coreComponents'
import { Scalar } from '../dataTree'
import { Parser } from '../queryLanguage'
import { getNestedField } from './getNestedField'
import { useEntityContext } from './useEntityContext'

export const useRelativeSingleField = <
	Persisted extends Scalar | GraphQlBuilder.Literal = Scalar | GraphQlBuilder.Literal,
	Produced extends Persisted = Persisted
>(
	field: RelativeSingleField,
) => {
	const entity = useEntityContext()
	const environment = useEnvironment()
	const expression = React.useMemo(
		() => Parser.parseQueryLanguageExpression(field, Parser.EntryPoint.RelativeSingleField, environment),
		[environment, field],
	)
	return React.useMemo(() => getNestedField<Persisted, Produced>(entity, expression.toOneProps, expression.fieldName), [
		entity,
		expression.fieldName,
		expression.toOneProps,
	])
}
