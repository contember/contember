import { Client } from '@contember/database'
import { AnyEventPayload } from './Payload'
import { Mapper } from '@contember/engine-content-api'
export declare class TriggerPayloadPersister {
	private readonly mapper
	private readonly client
	private readonly providers
	private readonly stageId
	private readonly schemaId
	constructor(mapper: Mapper, client: Client, providers: {
		uuid: () => string
	}, stageId: string, schemaId: number)
	persist(target: string, payloads: AnyEventPayload[]): Promise<void>
}
//# sourceMappingURL=TriggerPayloadPersister.d.ts.map
