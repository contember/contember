import * as React from 'react'
import { RelativeEntityList } from '../bindingTypes'
import { EntityListAccessor } from '../dao'
import { Parser } from '../queryLanguage'
import { getNestedEntityList } from './getNestedEntityList'
import { useEntityContext } from './useEntityContext'
import { useEnvironment } from './useEnvironment'

export const useRelativeEntityList = (field: RelativeEntityList): EntityListAccessor => {
	const entity = useEntityContext()
	const environment = useEnvironment()
	const expression = React.useMemo(
		() => Parser.parseQueryLanguageExpression(field, Parser.EntryPoint.RelativeEntityList, environment),
		[environment, field],
	)
	return React.useMemo(() => getNestedEntityList(entity, expression.toOneProps, expression.toManyProps), [
		entity,
		expression.toManyProps,
		expression.toOneProps,
	])
}
