import * as Typesafe from '@contember/typesafe'
export declare const serverConfigSchema: Typesafe.Type<{
	readonly port: number
	readonly http: {
		readonly requestBodySize?: string | undefined
	}
	readonly logging: {
		sentry?: {
			dsn: string
		} | undefined
	} | {
		readonly sentry?: {
			readonly dsn: string
		} | undefined
	}
} & {
	readonly monitoringPort?: number | undefined
	readonly workerCount?: string | number | undefined
	readonly projectGroup?: ({
		readonly domainMapping: string
	} & {
		readonly configHeader?: string | undefined
		readonly configEncryptionKey?: string | undefined
	}) | undefined
}>
export declare type ServerConfig = ReturnType<typeof serverConfigSchema>
//# sourceMappingURL=configSchema.d.ts.map
