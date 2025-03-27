import { useContentMutation, useContentQuery } from '@contember/react-client-content'
import { PlugIcon } from 'lucide-react'
import { Title } from '~/app/components/title'
import { Slots } from '~/lib/layout'
import { Button } from '~/lib/ui/button'
import { queryBuilder } from '../../../api/client'

const listHooksValue = queryBuilder.list('HooksValue', {
	orderBy: [{ createdAt: 'asc' }],
}, it => it.$$())

export const ContentApi = () => {
	const [items, refreshList] = useContentQuery(listHooksValue)

	const [addItemState, addItemMutation] = useContentMutation(
		() => queryBuilder.create('HooksValue', { data: { value: 0 } }),
		{ onResponse: refreshList },
	)

	const [updateValueState, updateValueMutation] = useContentMutation(
		(variables: { id: string; value: number }) =>
			queryBuilder.update('HooksValue', { by: { id: variables.id }, data: { value: variables.value } }),
		{ onResponse: refreshList },
	)

	const [deleteValueState, deleteValueMutation] = useContentMutation(
		(variables: { id: string }) =>
			queryBuilder.delete('HooksValue', { by: { id: variables.id } }),
		{ onResponse: refreshList },
	)

	const mutating = addItemState.state === 'loading' || updateValueState.state === 'loading' || deleteValueState.state === 'loading'
	const isLoading = items.state === 'loading' || items.state === 'refreshing'

	return (
		<div>
			<Slots.Title>
				<Title icon={<PlugIcon />}>Content API</Title>
			</Slots.Title>

			<Slots.Actions>
				<>
					<Button variant="secondary" onClick={refreshList} disabled={isLoading}>Refresh</Button>
					<Button onClick={() => addItemMutation({})} disabled={mutating}>New item</Button>
				</>
			</Slots.Actions>

			<div className="space-y-4">
				{'data' in items && items.data.length ? items.data.map(item => (
					<div
						key={item.id}
						className="flex items-center gap-3 p-4 bg-white even:bg-gray-50 rounded-lg"
					>
						<div className="flex gap-2">
							<Button
								size="sm"
								variant="secondary"
								disabled={mutating}
								onClick={() => updateValueMutation({ id: item.id, value: item.value + 1 })}
							>
								+
							</Button>
							<Button
								size="sm"
								variant="secondary"
								disabled={mutating}
								onClick={() => updateValueMutation({ id: item.id, value: item.value - 1 })}
							>
								-
							</Button>
						</div>

						<span className="text-lg font-medium w-12 text-center">{item.value}</span>

						<Button
							size="sm"
							variant="destructive"
							disabled={mutating}
							onClick={() => deleteValueMutation({ id: item.id })}
							className="ml-auto"
						>
							Delete
						</Button>
					</div>
				)) : <div className="p-4 bg-white rounded-lg">Try to add new item</div>}
			</div>
		</div>
	)
}
