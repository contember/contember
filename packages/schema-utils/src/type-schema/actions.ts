import * as Typesafe from '@contember/typesafe'
import { Actions } from '@contember/schema'

const selectionNodeSchemaFactory = (): Typesafe.Type<Actions.SelectionNode> => {
	return (input: unknown, path: PropertyKey[] = []): Actions.SelectionNode => {
		return Typesafe.array(Typesafe.union(
			Typesafe.string,
			Typesafe.tuple(
				Typesafe.string,
				Typesafe.anyJsonObject,
				selectionNodeSchemaFactory(),
			),
		))(input, path)
	}
}

const webhookTargetSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal('webhook'),
		name: Typesafe.string,
		url: Typesafe.string,
	}),
	Typesafe.partial({
		headers: Typesafe.record(Typesafe.string, Typesafe.string),
		timeoutMs: Typesafe.integer,
		maxAttempts: Typesafe.integer,
		initialRepeatIntervalMs: Typesafe.integer,
		batchSize: Typesafe.integer,
	}),
)
const webhookTargetSchemaCheck: Typesafe.Equals<Actions.WebhookTarget, ReturnType<typeof webhookTargetSchema>> = true

const anyTargetSchema: Typesafe.Type<Actions.AnyTarget> = Typesafe.union(webhookTargetSchema)

const watchTriggerSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal('watch'),
		name: Typesafe.string,
		entity: Typesafe.string,
		watch: selectionNodeSchemaFactory(),
		target: Typesafe.string,
	}),
	Typesafe.partial({
		selection: selectionNodeSchemaFactory(),
		priority: Typesafe.integer,
	}),
)

const watchTriggerSchemaCheck: Typesafe.Equals<Actions.WatchTrigger, ReturnType<typeof watchTriggerSchema>> = true


const basicTriggerSchema = Typesafe.intersection(
	Typesafe.object({
		type: Typesafe.literal('basic'),
		name: Typesafe.string,
		entity: Typesafe.string,
		create: Typesafe.boolean,
		delete: Typesafe.boolean,
		update: Typesafe.union(Typesafe.boolean, Typesafe.array(Typesafe.string)),
		target: Typesafe.string,
	}),
	Typesafe.partial({
		selection: selectionNodeSchemaFactory(),
		priority: Typesafe.integer,
	}),
)

const basicTriggerSchemaCheck: Typesafe.Equals<Actions.BasicTrigger, ReturnType<typeof basicTriggerSchema>> = true


const anyTriggerSchema = Typesafe.union(
	watchTriggerSchema,
	basicTriggerSchema,
)

export const actionsSchema = Typesafe.object({
	triggers: Typesafe.record(Typesafe.string, anyTriggerSchema),
	targets: Typesafe.record(Typesafe.string, anyTargetSchema),
})
