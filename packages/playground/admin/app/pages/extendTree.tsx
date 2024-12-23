import { Binding } from '~/lib/binding'
import { Button } from '~/lib/ui/button'
import { Loader } from '~/lib/ui/loader'
import {
	Component,
	EntityListSubTree,
	EntitySubTree,
	Field,
	TreeRootIdProvider,
	useEntityListSubTreeLoader,
	useEntitySubTreeLoader,
} from '@contember/interface'
import { useMemo } from 'react'

export const Single = () => <>
	<Binding>
		<LoadSingle />
	</Binding>
</>


const LoadSingle = () => {
	const entity = 'ExtendTreeSingle(unique=unique)'
	const [state, { reload }] = useEntitySubTreeLoader(
		{ entity }, // you may also pass "undefined" to load nothing
		useMemo(() => (<Value />), []), // make sure the children is memoized
	)

	const isContentReady = state.state === 'loaded' || state.state === 'refreshing'

	if (!isContentReady) {
		return <Loader position="static" />
	}

	return (
		<TreeRootIdProvider treeRootId={state.treeRootId}>
			<div>
				<Button onClick={reload} variant="secondary">Reload</Button>
				<div>
					<EntitySubTree entity={entity}>
						<Value />
					</EntitySubTree>
				</div>
			</div>
		</TreeRootIdProvider>
	)
}

export const Many = () => <>
	<Binding>
		<LoadMany />
	</Binding>
</>

const LoadMany = () => {
	const entities = 'ExtendTreeMany'
	const [state, { reload }] = useEntityListSubTreeLoader(
		{ entities },  // you may also pass "undefined" to load nothing
		useMemo(() => (<Value />), []), // make sure the children is memoized
	)

	const isContentReady = state.state === 'loaded' || state.state === 'refreshing'

	if (!isContentReady) {
		return <Loader position="static" />
	}

	return (
		<TreeRootIdProvider treeRootId={state.treeRootId}>
			<div>
				<Button onClick={reload} variant="secondary">Reload</Button>
				<div>
					<EntityListSubTree entities={entities}>
						<div>
							<Value />
						</div>
					</EntityListSubTree>
				</div>
			</div>
		</TreeRootIdProvider>
	)

}

const Value = Component(() => <Field field="value" />)
