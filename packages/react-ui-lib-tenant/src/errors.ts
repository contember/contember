import { FormErrorCode } from '@contember/react-client-tenant'
import { dict } from './dict.js'

const forbidden: FormErrorCode = 'FORBIDDEN'

/**
 * Message for a one-shot action that failed. A denial gets its own line, because "failed, try again"
 * is wrong advice when the answer is simply no.
 */
export const actionErrorMessage = (code: string, failed: string): string => code === forbidden ? dict.tenant.commonErrorMessages.FORBIDDEN : failed
