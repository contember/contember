import * as React from 'react'
import { RelativeEntityList } from '../bindingTypes'
import { useEnvironment } from '../coreComponents'
import { EntityCollectionAccessor } from '../dao'
import { Parser } from '../queryLanguage'
import { getNestedEntityList } from './getNestedEntityList'
import { useEntityContext } from './useEntityContext'

export const useRelativeEntityList = (field: RelativeEntityList): EntityCollectionAccessor => {
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
