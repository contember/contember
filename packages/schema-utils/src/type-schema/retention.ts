import * as Typesafe from '@contember/typesafe'
import { Retention } from '@contember/schema'
import { anyWhereSchema } from './where.js'

const scheduleSchema = Typesafe.union(
	Typesafe.object({ cron: Typesafe.string }),
	Typesafe.object({ everySeconds: Typesafe.number }),
	Typesafe.object({ everyMinutes: Typesafe.number }),
)
const scheduleSchemaCheck: Typesafe.Equals<Retention.Schedule, ReturnType<typeof scheduleSchema>> = true

const policySchema = Typesafe.intersection(
	Typesafe.object({
		name: Typesafe.string,
		entity: Typesafe.string,
		strategy: Typesafe.enumeration('raw', 'content'),
	}),
	Typesafe.partial({
		olderThan: Typesafe.object({
			field: Typesafe.string,
			interval: Typesafe.string,
		}),
		where: anyWhereSchema,
		schedule: scheduleSchema,
		batchSize: Typesafe.integer,
		maxPerRun: Typesafe.integer,
	}),
)
const policySchemaCheck: Typesafe.Equals<Retention.Policy, ReturnType<typeof policySchema>> = true

export const retentionSchema = Typesafe.object({
	policies: Typesafe.record(Typesafe.string, policySchema),
})
