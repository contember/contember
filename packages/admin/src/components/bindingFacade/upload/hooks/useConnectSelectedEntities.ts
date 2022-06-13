import { BindingError, EntityAccessor, FieldValue, QueryLanguage, useEnvironment } from '@contember/binding'
import { useCallback } from 'react'
import { unstable_batchedUpdates } from 'react-dom'
import { ResolvedFileKinds } from '../ResolvedFileKinds'

type EntityConnector = (entity: EntityAccessor, selected: EntityAccessor) => void;
export const useConnectSelectedEntities = (
	fileKinds: ResolvedFileKinds,
	createNewEntity: (initialize: EntityAccessor.BatchUpdatesHandler) => void,
) => {

	const createConnector = useCreateEntityConnector()

	return useCallback((selectedEntities: EntityAccessor[], discriminateBy?: FieldValue) => {
		let connectEntity: EntityConnector

		if (fileKinds.isDiscriminated) {
			if (discriminateBy) {
				const fileKind = fileKinds.fileKinds.get(discriminateBy)
				if (!fileKind) {
					throw new Error()
				}
				const innerConnector = createConnector(fileKind.datum.baseEntity)
				connectEntity = (entity, selected) => {
					if (fileKinds.baseEntity) {
						entity = entity.getEntity(fileKinds.baseEntity)
					}
					entity.getField(fileKinds.discriminationField).updateValue(discriminateBy)
					innerConnector(entity, selected)
				}
			} else {
				connectEntity = createConnector(fileKinds.baseEntity)
			}
		} else {
			connectEntity = createConnector(fileKinds.fileKind.baseEntity)
		}

		unstable_batchedUpdates(() => {
			for (const selected of selectedEntities) {
				createNewEntity(getEntity => {
					connectEntity(getEntity(), selected)
				})
			}
		})
	}, [createNewEntity, createConnector, fileKinds])
}

const useCreateEntityConnector = () => {
	const env = useEnvironment()
	return useCallback((baseEntity: string | undefined): EntityConnector => {
		if (!baseEntity) {
			throw new BindingError('Please set baseEntity prop.')
		}
		const desugaredBase = QueryLanguage.desugarRelativeSingleEntity(baseEntity, env)
		return (entity, selected) => {
			const hasOne = desugaredBase.hasOneRelationPath
			const parentEntity = entity.getRelativeSingleEntity({
				hasOneRelationPath: hasOne.slice(0, -1),
			})
			parentEntity.connectEntityAtField(hasOne[hasOne.length - 1].field, selected)
		}
	}, [env])
}
