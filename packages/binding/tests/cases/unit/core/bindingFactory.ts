import { TreeStore } from '../../../../src/core/TreeStore'
import { Environment, MarkerTreeGenerator } from '../../../../src'
import { Schema } from '../../../../src/core/schema'
import { SchemaPreprocessor } from '../../../../src/core/schema/SchemaPreprocessor'
import { Config } from '../../../../src/core/Config'
import { EventManager } from '../../../../src/core/EventManager'
import { DirtinessTracker } from '../../../../src/core/DirtinessTracker'
import { StateInitializer } from '../../../../src/core/StateInitializer'
import { TreeAugmenter } from '../../../../src/core/TreeAugmenter'
import assert from 'assert'
import { ReactNode } from 'react'
import { RawSchema } from '../../../../src/core/schema/RawSchema'

export const createBindingWithEntitySubtree = ({ node, schema }: {node: ReactNode, schema: RawSchema}) => {
	const finalSchema = new Schema(SchemaPreprocessor.processRawSchema(schema))
	const treeStore = new TreeStore(finalSchema)
	const environment = Environment.create().withSchema(finalSchema)
	const generator = new MarkerTreeGenerator(node, environment)
	const config = new Config()
	const eventManager = new EventManager({} as any, {} as any, config, new DirtinessTracker(), () => null, treeStore)
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
