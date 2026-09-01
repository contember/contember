import { IncomingHttpHeaders } from 'node:http'
import { parseTraceparent, SpanContext } from '@contember/telemetry'
import { isInCIDR } from '../utils/remoteAddress.js'

export type AcceptIncomingTraceMode = 'none' | 'trusted-proxies' | 'all'

export interface IncomingTraceTrustInput {
	mode: AcceptIncomingTraceMode
	/** The immediate peer socket address - a forwarded header must never widen this trust. */
	peerAddress: string | undefined
	trustedProxies: readonly string[]
}

export const isIncomingTraceTrusted = ({ mode, peerAddress, trustedProxies }: IncomingTraceTrustInput): boolean => {
	if (mode === 'none') {
		return false
	}
	if (mode === 'all') {
		return true
	}
	return peerAddress !== undefined && isInCIDR(peerAddress, trustedProxies)
}

export interface IncomingTraceRequest {
	readonly headers: IncomingHttpHeaders
	readonly socket: { readonly remoteAddress?: string }
}

export const resolveIncomingSpanContext = (
	request: IncomingTraceRequest,
	trust: Omit<IncomingTraceTrustInput, 'peerAddress'>,
): SpanContext | undefined => {
	const traceparent = request.headers.traceparent
	if (typeof traceparent !== 'string') {
		return undefined
	}
	if (!isIncomingTraceTrusted({ ...trust, peerAddress: request.socket.remoteAddress })) {
		return undefined
	}
	const parsed = parseTraceparent(traceparent)
	if (parsed === undefined) {
		return undefined
	}
	const tracestate = request.headers.tracestate
	return typeof tracestate === 'string' ? { ...parsed, traceState: tracestate } : parsed
}
