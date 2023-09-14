import { AccessorTree, Entity, EntityAccessor, useAccessorTreeState } from '@contember/react-binding'
import { Button, Stack, useDialog } from '@contember/ui'
import { useMessageFormatter } from '@contember/react-i18n'
import { ReactNode, useCallback } from 'react'
import { choiceFieldDictionary } from './choiceFieldDictionary'

export const useOpenCreateNewDialog = () => {
	const dialog = useDialog<true>()
	const localization = useMessageFormatter(choiceFieldDictionary)
	const accessorTreeState = useAccessorTreeState()

	return useCallback(async ({ createNewForm, entity }: {entity: EntityAccessor, createNewForm?: ReactNode}) => {
		if (!createNewForm) {
			return false
		}
		return await dialog.openDialog({
			heading: localization('choiceField.createNew.dialogTitle'),
			content: contentProps => (
				<Stack direction="vertical">
					<AccessorTree state={accessorTreeState}>
						<Entity accessor={entity}>{createNewForm}</Entity>
					</AccessorTree>
					<Stack direction="horizontal" evenly>
						<Button onClick={() => contentProps.resolve()} distinction="default"
								elevation="none">{localization('choiceField.createNew.cancelButtonText')}</Button>
						<Button onClick={() => contentProps.resolve(true)} distinction="primary"
								elevation="none">{localization('choiceField.createNew.confirmButtonText')}</Button>
					</Stack>
				</Stack>
			),
		})
	}, [accessorTreeState, dialog, localization])
}
