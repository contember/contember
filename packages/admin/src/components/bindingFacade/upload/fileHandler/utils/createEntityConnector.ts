import { BindingError, EntityAccessor, Environment, QueryLanguage } from '@contember/react-binding'
import { EntityConnectorFactory } from '../../internalComponents/hooks/useConnectSelectedEntities'

export const createEntityConnectorFactory = (env: Environment, ...baseEntity: (string | undefined)[]): EntityConnectorFactory => {
	if (!baseEntity[baseEntity.length - 1]) {
		throw new BindingError('Cannot use "fileSelectionComponent" when "baseEntity" prop is not set. For more information, please consult the documentation.')
	}
	const path = baseEntity.filter(
		(it): it is string => it !== undefined)
		.map(it => QueryLanguage.desugarRelativeSingleEntity(it, env))
		.flatMap(it => it.hasOneRelationPath)

	return selected => {
		const connector = (parent: EntityAccessor) => {
			const parentEntity = parent.getRelativeSingleEntity({
				hasOneRelationPath: path.slice(0, -1),
			})
			parentEntity.connectEntityAtField(path[path.length - 1].field, selected)
		}
		connector.entity = selected
		return connector
	}
}
