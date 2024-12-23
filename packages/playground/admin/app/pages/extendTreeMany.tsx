import {
	Component,
	EntityListSubTree,
	Field,
	TreeRootIdProvider,
	useEntityListSubTreeLoader,
} from '@contember/interface'
import { LoaderIcon } from 'lucide-react'
import { useMemo } from 'react'
import { Title } from '~/app/components/title'
import { Binding, PersistButton } from '~/lib/binding'
import { InputField } from '~/lib/form'
import { Slots, SlotTargets } from '~/lib/layout'
import { Button } from '~/lib/ui/button'
import { Input } from '~/lib/ui/input'
import { Loader } from '~/lib/ui/loader'

export default () => (
	<div className="space-y-6">
		<Slots.Title>
			<Title icon={<LoaderIcon />}>
				Entity List Subtree
			</Title>
		</Slots.Title>

		<div className="max-w-2xl">
			<div className="space-y-6 text-gray-700">
				<p>
					The Entity List Subtree feature enables dynamic loading and refreshing of entity data. This example shows how data can be updated and reloaded independently:
				</p>

				<ol className="list-decimal list-inside">
					<li>View: Displays data that can be refreshed to show the latest changes</li>
					<li>Editor: Provides direct data editing capabilities with save functionality</li>
				</ol>

				<p>
					Make changes in the Editor section and save them. Then use the reload button in the View section to see the updated data.
				</p>
				<p>
					You can find the source code of this page in the{' '}
					<a
						href="https://github.com/contember/contember/tree/main/packages/playground/admin/app/pages/extendTreeMany.tsx"
						className="text-blue-600 hover:text-blue-800 transition-colors duration-200 font-medium"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="Visit Contember repository (opens in new tab)"
					>
						Contember repository
					</a>
					.
				</p>

				<p className="italic">
					PS: Check the neat trick with SlotTargets.Actions and Reload button in View.
				</p>
			</div>
		</div>

		<Binding>
			<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<header className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold text-gray-900">View</h2>
					<SlotTargets.Actions />
				</header>

				<LoadMany />
			</div>
		</Binding>

		<Binding>
			<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
				<header className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-bold text-gray-900">Editor</h2>
					<PersistButton />
				</header>

				<main className="flex space-x-4">
					<EntityListSubTree entities="ExtendTreeMany" orderBy="value">
						<InputField field="value" />
					</EntityListSubTree>
				</main>
			</div>
		</Binding>
	</div>
)


const LoadMany = () => {
	const entities = 'ExtendTreeMany'
	const [state, { reload }] = useEntityListSubTreeLoader(
		{ entities, orderBy: 'value' },  // you may also pass "undefined" to load nothing
		useMemo(() => (<Value />), []), // make sure the children is memoized
	)

	const isContentReady = state.state === 'loaded' || state.state === 'refreshing'

	if (!isContentReady) {
		return <Loader position="static" />
	}

	return (
		<TreeRootIdProvider treeRootId={state.treeRootId}>
			<div>
				<Slots.Actions>
					<Button onClick={reload} variant="secondary">Reload</Button>
				</Slots.Actions>

				<div className="flex space-x-4">
					<EntityListSubTree entities={entities} orderBy="value">
						<Value />
					</EntityListSubTree>
				</div>
			</div>
		</TreeRootIdProvider>
	)
}

const Value = Component(() => <Field<string> field="value" format={value => <Input value={value ?? ''} className="max-w-md" readOnly />} />)
