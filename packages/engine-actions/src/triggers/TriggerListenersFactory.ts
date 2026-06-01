import { TriggerListenersStore } from './TriggerListenersStore.js'
import { TriggerListenerBuilder } from './TriggerListenersBuilder.js'
import { Schema } from '@contember/schema'

export class TriggerListenersFactory {
	constructor(
		private readonly schema: Schema,
	) {
	}

	public create(): TriggerListenersStore {
		const builder = new TriggerListenerBuilder(this.schema.model)
		for (const trigger of Object.values(this.schema.actions.triggers)) {
			builder.add(trigger)
		}

		return builder.createStore()
	}
}
