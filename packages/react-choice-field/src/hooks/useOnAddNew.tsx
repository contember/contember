import { EntityAccessor, useGetEntityListSubTree } from '@contember/react-binding'
import { useMemo } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { useDesugaredOptionPath } from './useDesugaredOptionPath'

export const useOnAddNew = ({ createNewForm, openCreateNewFormDialog, connect, ...props }: BaseDynamicChoiceField & { connect: (entity: EntityAccessor) => void}) => {
	const desugaredOptionPath = useDesugaredOptionPath(props, undefined)
	const getSubTree = useGetEntityListSubTree()

	return useMemo(() => {
			if (!createNewForm || !openCreateNewFormDialog) {
				return undefined
			}
			return async () => {
				const subTree = getSubTree({
					entities: {
						entityName: desugaredOptionPath.entityName,
					},
					limit: 0,
				})
				const newEntityId = subTree.createNewEntity()
				const entity = subTree.getChildEntityById(newEntityId.value)

				const result = await openCreateNewFormDialog({ entity, createNewForm })
				if (result) {
					const entityToConnect = entity.getAccessor()
					connect(entityToConnect)
				} else {
					entity.deleteEntity()
				}
			}
		}, [createNewForm, openCreateNewFormDialog, getSubTree, desugaredOptionPath.entityName, connect],
	)
}
