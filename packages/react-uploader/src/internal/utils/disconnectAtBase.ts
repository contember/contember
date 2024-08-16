import { EntityAccessor, QueryLanguage, SugaredRelativeSingleEntity } from '@contember/binding'

export const disconnectAtBase = (baseEntity: SugaredRelativeSingleEntity['field'], parentEntity: EntityAccessor) => {
	const desugaredBase = QueryLanguage.desugarRelativeSingleEntity({ field: baseEntity }, parentEntity.environment)
	parentEntity.disconnectEntityAtField(desugaredBase.hasOneRelationPath[0].field)
}
