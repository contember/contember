import { DecoratorFunction, EntityConstructor } from '../../utils'
import { Actions } from '@contember/schema'
import { triggersStore } from './internal/store'
import { ActionsTarget } from './targets'

export type TriggerWebhookDefinition = {
	webhook:
		| string
		| Omit<Actions.WebhookTarget, 'type' | 'name'> & { name?: string }
}

export type TriggerTargetDefinition = {
	target: (Omit<Actions.AnyTarget, 'name'> & { name?: string }) | ActionsTarget
}

export type TargetDefinition =
	| TriggerWebhookDefinition
	| TriggerTargetDefinition

export type BasicTriggerDefinition =
	& {
		readonly name: string
		readonly create?: boolean
		readonly delete?: boolean
		readonly update?: boolean | readonly string[]
		readonly selection?: Actions.SelectionNode | string
	}
	& TargetDefinition

export type WatchTriggerDefinition =
	& {
		readonly name: string
		readonly watch: Actions.SelectionNode | string
		readonly selection?: Actions.SelectionNode | string
	}
	& TargetDefinition

export const trigger = <T>(definition: BasicTriggerDefinition): DecoratorFunction<T> => (entity: EntityConstructor<T>) => {
	triggersStore.update(entity, it => [...it, { type: 'basic', definition }])
}

export const watch = <T>(definition: WatchTriggerDefinition): DecoratorFunction<T> => (entity: EntityConstructor<T>) => {
	triggersStore.update(entity, it => [...it, { type: 'watch', definition }])
}

