import { Binding } from '@app/lib/binding'
import {
	Component,
	EntityListSubTree,
	EntitySubTree,
	Field,
	TreeRootIdProvider,
	useEntityListSubTreeLoader,
	useEntitySubTreeLoader,
} from '@contember/react-binding'
import { useMemo } from 'react'
import { Loader } from '@app/lib/ui/loader'
import { Button } from '@app/lib/ui/button'

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
	if (state.state === 'loaded' || state.state === 'refreshing') {
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
	return <Loader position="static" />
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
	if (state.state === 'loaded' || state.state === 'refreshing') {
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
	return <Loader position="static" />
}

const Value = Component(() => <Field field="value" />)
