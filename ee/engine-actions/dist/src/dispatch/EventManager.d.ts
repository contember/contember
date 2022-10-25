import { Client } from '@contember/database'
export declare class EventManager {
	private readonly db
	constructor(db: Client)
	fetchForProcessing(limit: number): Promise<void>
}
//# sourceMappingURL=EventManager.d.ts.map
