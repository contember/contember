export interface SystemEvent {
	id: string
	createdAt: string
	type: 'CREATE' | 'UPDATE' | 'DELETE'
	dependencies: string[]
	description: string
	identityDescription: string
	transactionId: string
}
