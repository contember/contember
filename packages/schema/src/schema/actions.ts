import { JSONObject } from './json'

export namespace Actions {
	export type SelectionNodeSub = readonly [name: string, args: JSONObject, fields: SelectionNode]
	export type SelectionNode = readonly (string | SelectionNodeSub)[]

	export type AnyTarget =
		| WebhookTarget

	export type WebhookTarget = {
		readonly type: 'webhook'
		readonly name: string
		readonly url: string
		readonly headers?: {
			readonly [key: string]: string
		}
		readonly timeoutMs?: number
		readonly maxAttempts?: number
		readonly initialRepeatIntervalMs?: number
		readonly batchSize?: number
	}

	export type AnyTrigger =
		| BasicTrigger
		| WatchTrigger

	export type TriggerCommon = {
		readonly name: string
		readonly selection?: SelectionNode
		readonly target: string
		readonly priority?: number
	}

	export type BasicTrigger =
		& TriggerCommon
		& {
			readonly type: 'basic'
			readonly entity: string
			readonly create: boolean
			readonly delete: boolean
			readonly update: boolean | readonly string[]
		}

	export type WatchTrigger =
		& TriggerCommon
		& {
			readonly type: 'watch'
			readonly entity: string
			readonly watch: SelectionNode
		}

	export type Schema = {
		readonly triggers: {
			readonly [name: string]: AnyTrigger
		}
		readonly targets: {
			readonly [name: string]: AnyTarget
		}
	}
}
