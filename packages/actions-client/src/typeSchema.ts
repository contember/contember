import * as Typesafe from '@contember/typesafe'
import { ActionsPayload } from '@contember/schema'

const primaryValue = Typesafe.union(Typesafe.integer, Typesafe.string)

const updateEventSchema =
	Typesafe.intersection(
		Typesafe.object({
			operation: Typesafe.literal('update'),
			entity: Typesafe.string,
			id: primaryValue,
			values: Typesafe.anyJsonObject,
		}),
		Typesafe.partial({
			old: Typesafe.anyJsonObject,
			selection: Typesafe.anyJsonObject,
			path: Typesafe.array(Typesafe.string),
		}),
	)

const updateEventSchemaCheck: Typesafe.Equals<ActionsPayload.UpdateEvent, ReturnType<typeof updateEventSchema>> = true


const createEventSchema =
	Typesafe.intersection(
		Typesafe.object({
			operation: Typesafe.literal('create'),
			entity: Typesafe.string,
			id: primaryValue,
			values: Typesafe.anyJsonObject,
		}),
		Typesafe.partial({
			selection: Typesafe.anyJsonObject,
			path: Typesafe.array(Typesafe.string),
		}),
	)

const createEventSchemaCheck: Typesafe.Equals<ActionsPayload.CreateEvent, ReturnType<typeof createEventSchema>> = true

const deleteEventSchema =
	Typesafe.intersection(
		Typesafe.object({
			operation: Typesafe.literal('delete'),
			entity: Typesafe.string,
			id: primaryValue,
		}),
		Typesafe.partial({
			selection: Typesafe.anyJsonObject,
			path: Typesafe.array(Typesafe.string),
		}),
	)

const deleteEventSchemaCheck: Typesafe.Equals<ActionsPayload.DeleteEvent, ReturnType<typeof deleteEventSchema>> = true

const junctionConnectEventSchema =
	Typesafe.intersection(
		Typesafe.object({
			operation: Typesafe.literal('junction_connect'),
			entity: Typesafe.string,
			id: primaryValue,
			relation: Typesafe.string,
			inverseId: primaryValue,
		}),
		Typesafe.partial({
			selection: Typesafe.anyJsonObject,
			path: Typesafe.array(Typesafe.string),
		}),
	)

const junctionConnectEventSchemaCheck: Typesafe.Equals<ActionsPayload.JunctionConnectEvent, ReturnType<typeof junctionConnectEventSchema>> = true

const junctionDisconnectEventSchema =
	Typesafe.intersection(
		Typesafe.object({
			operation: Typesafe.literal('junction_disconnect'),
			entity: Typesafe.string,
			id: primaryValue,
			relation: Typesafe.string,
			inverseId: primaryValue,
		}),
		Typesafe.partial({
			selection: Typesafe.anyJsonObject,
			path: Typesafe.array(Typesafe.string),
		}),
	)

const junctionDisconnectEventSchemaCheck: Typesafe.Equals<ActionsPayload.JunctionDisconnectEvent, ReturnType<typeof junctionDisconnectEventSchema>> = true

const baseEvent: Typesafe.Type<ActionsPayload.BaseEventPayload> = Typesafe.discriminatedUnion(
	'operation',
	{
		create: createEventSchema,
		update: updateEventSchema,
		delete: deleteEventSchema,
		junction_connect: junctionConnectEventSchema,
		junction_disconnect: junctionDisconnectEventSchema,
	},
	{ keepDiscriminator: true },
)

const watchEventPayloadSchema = Typesafe.intersection(
	Typesafe.object({
		operation: Typesafe.literal('watch'),
		entity: Typesafe.string,
		trigger: Typesafe.string,
		id: primaryValue,
		events: Typesafe.array(baseEvent),
	}),
	Typesafe.partial({
		selection: Typesafe.anyJsonObject,
	}),
)

const watchEventSchemaCheck: Typesafe.Equals<ActionsPayload.WatchEventPayload, ReturnType<typeof watchEventPayloadSchema>> = true

const baseEventPayloadExtra = Typesafe.object({
	trigger: Typesafe.string,
})
const basicEventPayloadSchema = Typesafe.intersection(baseEvent, baseEventPayloadExtra)

const basicEventPayloadSchemaCheck: Typesafe.Equals<ActionsPayload.BasicEventPayload, ReturnType<typeof basicEventPayloadSchema>> = true

const webhookMetaSchema = Typesafe.object({
	eventId: Typesafe.string,
	transactionId: Typesafe.string,
	createdAt: Typesafe.string,
	lastStateChange: Typesafe.string,
	numRetries: Typesafe.integer,
	trigger: Typesafe.string,
	target: Typesafe.string,
})


const webhookMetaSchemaCheck: Typesafe.Equals<ActionsPayload.WebhookMeta, ReturnType<typeof webhookMetaSchema>> = true

const anyEventPayloadSchema = Typesafe.union(watchEventPayloadSchema, basicEventPayloadSchema)

const anyEventPayloadSchemaCheck: Typesafe.Equals<ActionsPayload.AnyEventPayload, ReturnType<typeof anyEventPayloadSchema>> = true

const webhookEventSchema = Typesafe.intersection(
	anyEventPayloadSchema,
	Typesafe.object({
		meta: webhookMetaSchema,
	}),
)
const webhookEventSchemaCheck: Typesafe.Equals<ActionsPayload.WebhookEvent, ReturnType<typeof webhookEventSchema>> = true

export const webhookRequestPayloadSchema = Typesafe.object({
	events: Typesafe.array(webhookEventSchema as Typesafe.Type<ActionsPayload.WebhookEvent>),
})
const webhookRequestPayloadSchemaCheck: Typesafe.Equals<ActionsPayload.WebhookRequestPayload, ReturnType<typeof webhookRequestPayloadSchema>> = true

const webhookResponseFailure = Typesafe.intersection(
	Typesafe.object({
		eventId: Typesafe.string,
	}),
	Typesafe.partial({
		error: Typesafe.string,
	}),
)
const webhookResponseFailureSchemaCheck: Typesafe.Equals<ActionsPayload.WebhookResponseFailure, ReturnType<typeof webhookResponseFailure>> = true

export const webhookResponsePayloadSchema = Typesafe.object({
	failures: Typesafe.array(webhookResponseFailure as Typesafe.Type<ActionsPayload.WebhookResponseFailure>),
})

const webhookResponsePayloadSchemaCheck: Typesafe.Equals<ActionsPayload.WebhookResponsePayload, ReturnType<typeof webhookResponsePayloadSchema>> = true
