import * as React from 'react'
import { RelativeSingleField } from '../../bindingTypes'
import { useEntityContext, useEnvironment } from '../../coreComponents'
import { Parser } from '../../queryLanguage'
import { getNestedField } from './getNestedField'

export const useRelativeSingleField = (field: RelativeSingleField) => {
	const entity = useEntityContext()
	const environment = useEnvironment()
	return React.useMemo(() => {
		const { fieldName, toOneProps } = Parser.parseQueryLanguageExpression(
			field,
			Parser.EntryPoint.RelativeSingleField,
			environment,
		)
		return getNestedField(entity, toOneProps, fieldName)
	}, [entity, environment, field])
}
