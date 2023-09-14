import assert from 'assert'
import { ReactNode } from 'react'
import {
	Config,
	DirtinessTracker,
	Environment,
	EventManager,
	RawSchema,
	Schema,
	SchemaPreprocessor,
	StateInitializer,
	TreeAugmenter,
	TreeStore,
} from '@contember/binding'
import { MarkerTreeGenerator } from '../../../../src'

export const createBindingWithEntitySubtree = ({ node, schema }: {node: ReactNode, schema: RawSchema}) => {
	const finalSchema = new Schema(SchemaPreprocessor.processRawSchema(schema))
	const treeStore = new TreeStore(finalSchema)
	const environment = Environment.create().withSchema(finalSchema)
	const generator = new MarkerTreeGenerator(node, environment)
	const config = new Config()
	const eventManager = new EventManager({} as any, {} as any, config, new DirtinessTracker(), () => null, treeStore, it => it())
	const stateInitializer = new StateInitializer(
		{} as any,
		{} as any,
		eventManager,
		treeStore,
	)

	const treeAugmenter = new TreeAugmenter(eventManager, stateInitializer, treeStore)
	treeAugmenter.extendTreeStates(undefined, generator.generate())

	const entity = Array.from(treeStore.subTreeStatesByRoot.get(undefined)!.values())[0]
	assert(entity.type === 'entityRealm')

	return { entity, eventManager }
}
