import * as Typesafe from '@contember/typesafe'
import { serverConfigSchema as baseServerConfigSchema } from '@contember/engine-http'

export const serverConfigSchema = Typesafe.intersection(
	baseServerConfigSchema,
	Typesafe.partial({
		monitoringPort: Typesafe.number,
		workerCount: Typesafe.union(Typesafe.number, Typesafe.string),
		projectGroup: (val: unknown, path: PropertyKey[] = []) => Typesafe.valueAt(val, ['domainMapping']) === undefined
			? undefined
			: Typesafe.intersection(
				Typesafe.object({
					domainMapping: Typesafe.string,
				}),
				Typesafe.partial({
					configHeader: Typesafe.string,
					configEncryptionKey: Typesafe.string,
				}),
			)(val, path),
	}),
)
export type ServerConfig = ReturnType<typeof serverConfigSchema>
