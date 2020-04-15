import { EntityAccessor, Environment, QueryLanguage, SugaredFieldProps } from '@contember/binding'

export const getIsFieldFilled = (field: SugaredFieldProps['field']) => (
	entity: EntityAccessor,
	environment: Environment,
) => {
	const desugaredField = QueryLanguage.desugarRelativeSingleField(field, environment)
	return entity.getRelativeSingleField(desugaredField).currentValue !== null
}
