import { EntityAccessor, QueryLanguage } from '@contember/binding'

export const disconnectAtBase = (baseEntity: string, parentEntity: EntityAccessor) => {
	const desugaredBase = QueryLanguage.desugarRelativeSingleEntity(baseEntity, parentEntity.environment)
	parentEntity.disconnectEntityAtField(desugaredBase.hasOneRelationPath[0].field)
}
