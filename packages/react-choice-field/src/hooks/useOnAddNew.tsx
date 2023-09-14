import { EntityAccessor, useGetEntityListSubTree } from '@contember/react-binding'
import { useMemo } from 'react'
import { BaseDynamicChoiceField } from '../BaseDynamicChoiceField'
import { useDesugaredOptionPath } from './useDesugaredOptionPath'

export const useOnAddNew = ({ openDialog, connect, ...props }: BaseDynamicChoiceField & { connect: (entity: EntityAccessor) => void, openDialog?: (entity: EntityAccessor) => Promise<boolean>}) => {
	const desugaredOptionPath = useDesugaredOptionPath(props, undefined)
	const getSubTree = useGetEntityListSubTree()

	return useMemo(() => {
			if (!openDialog) {
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

				const result = await openDialog(entity)
				if (result === true) {
					const entityToConnect = entity.getAccessor()
					connect(entityToConnect)
				} else {
					entity.deleteEntity()
				}
			}
		}, [openDialog, getSubTree, desugaredOptionPath.entityName, connect],
	)
}
