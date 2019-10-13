import * as React from 'react'
import { useEnvironment } from './useEnvironment'
import { RelativeSingleEntity } from '../bindingTypes'
import { EntityAccessor } from '../dao'
import { Parser } from '../queryLanguage'
import { getNestedEntity } from './getNestedEntity'
import { useEntityContext } from './useEntityContext'

export const useRelativeSingleEntity = (field: RelativeSingleEntity): EntityAccessor => {
	const entity = useEntityContext()
	const environment = useEnvironment()
	const expression = React.useMemo(
		() => Parser.parseQueryLanguageExpression(field, Parser.EntryPoint.RelativeSingleEntity, environment),
		[environment, field],
	)
	return React.useMemo(() => getNestedEntity(entity, expression.toOneProps), [entity, expression.toOneProps])
}
