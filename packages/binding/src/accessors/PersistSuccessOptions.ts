import { BindingOperations } from './BindingOperations'

export interface PersistSuccessOptions extends Omit<BindingOperations, 'persistAll'> {
	successType: 'justSuccess' | 'nothingToPersist'
	unstable_persistedEntityIds: string[]
}
