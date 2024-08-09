import { ReactNode } from 'react'
import { Config, DirtinessTracker, Environment, EventManager, Schema, SchemaStore, StateInitializer, TreeAugmenter, TreeStore } from '@contember/binding-legacy'
import { MarkerTreeGenerator } from '../../src'

export const createBinding = ({ node, schema }: { node: ReactNode; schema: SchemaStore }) => {
	const finalSchema = new Schema(schema)
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

	return { eventManager, treeStore, environment }
}
