import { BindingOperations } from './BindingOperations'

export interface PersistSuccessOptions extends Omit<BindingOperations, 'persist'> {
	successType: 'justSuccess' | 'nothingToPersist'
	unstable_persistedEntityIds: string[]
}
