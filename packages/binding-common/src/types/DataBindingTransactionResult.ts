import { MutationResult, TransactionResult } from '@contember/client'
import { ReceivedEntityData } from './QueryRequestResponse'

export type DataBindingTransactionResult = TransactionResult<Record<string, MutationResult<ReceivedEntityData>>>
