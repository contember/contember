import { Actions, Model } from '@contember/schema'
import { TriggerListenersStore } from './TriggerListenersStore'
export declare class TriggerListenerBuilder {
	private readonly model
	private readonly data
	constructor(model: Model.Schema)
	add(trigger: Actions.AnyTrigger): void
	private processBasicTrigger
	private processIndirectListeners
	private processIndirectListenersNode
	createStore(): TriggerListenersStore
	private addListener
	private addJunctionListener
}
//# sourceMappingURL=TriggerListenersBuilder.d.ts.map
