import { TenantApiTransport } from '../TenantApiTransport.js'
import { TenantApiKeyClient } from './TenantApiKeyClient.js'
import { TenantMemberClient } from './TenantMemberClient.js'
import { TenantPersonClient } from './TenantPersonClient.js'
import { TenantPolicyClient } from './TenantPolicyClient.js'
import { TenantProjectClient } from './TenantProjectClient.js'

export * from './TenantApiKeyClient.js'
export * from './TenantMemberClient.js'
export * from './TenantPersonClient.js'
export * from './TenantPolicyClient.js'
export * from './TenantProjectClient.js'

/** One instance of every tenant domain client, all sharing a single transport. */
export interface TenantClients {
	readonly project: TenantProjectClient
	readonly person: TenantPersonClient
	readonly member: TenantMemberClient
	readonly apiKey: TenantApiKeyClient
	readonly policy: TenantPolicyClient
}

export const createTenantClients = (transport: TenantApiTransport): TenantClients => ({
	project: new TenantProjectClient(transport),
	person: new TenantPersonClient(transport),
	member: new TenantMemberClient(transport),
	apiKey: new TenantApiKeyClient(transport),
	policy: new TenantPolicyClient(transport),
})
