import { EntityId } from '@contember/binding-legacy'

/**
 * The shape the content API puts on the wire, as opposed to `ReceivedEntityData`, which is what the client works
 * with once `ContentClient` has unwrapped the relay-style connections.
 */
export type WireEntity = { [placeholderName: string]: WireValue }

export type WireConnection = { edges: { node: WireEntity }[] }

export type WireValue = string | number | boolean | null | EntityId | WireEntity | WireConnection

export const wireConnection = (nodes: WireEntity[]): WireConnection => ({ edges: nodes.map(node => ({ node })) })
