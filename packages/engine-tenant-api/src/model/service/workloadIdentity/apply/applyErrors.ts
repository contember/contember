import { JSONValue } from '@contember/schema'
import { ApplyWorkloadIdentityTrustErrorCode } from '../../../../schema/index.js'
import { Response, ResponseError } from '../../../utils/Response.js'

export interface ApplyErrorMetadata {
	/** Per-condition, per-membership or per-rule detail. */
	readonly details: JSONValue
}

export type ApplyResponse<Result> = Response<Result, ApplyWorkloadIdentityTrustErrorCode, ApplyErrorMetadata>

export type ApplyError = ResponseError<ApplyWorkloadIdentityTrustErrorCode, ApplyErrorMetadata>

export const createApplyError = (code: ApplyWorkloadIdentityTrustErrorCode, message: string, details?: JSONValue): ApplyError =>
	new ResponseError(code, message, details === undefined ? undefined : { details })
