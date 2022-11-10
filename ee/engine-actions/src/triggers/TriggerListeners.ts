import {
	CreateListener,
	DeleteListener,
	IndirectListener,
	JunctionListener,
	UpdateListener,
} from './TriggerListenersStore'

export interface TriggerListeners {
	readonly deleteListeners: Map<string, DeleteListener[]>
	readonly createListeners: Map<string, CreateListener[]>
	readonly updateListeners: Map<string, UpdateListener[]>
	readonly indirectListeners: Map<string, IndirectListener[]>
	readonly junctionListeners: Map<string, Map<string, JunctionListener[]>>
}

