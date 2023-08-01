import { Try } from './Try'

/**
 * Describes types that can be narrowed
 */
export type Narrowable =
	| string
	| number
	| bigint
	| boolean


type NarrowRaw<A> =
	| (A extends [] ? [] : never)
	| (A extends Narrowable ? A : never)
	| ({ [K in keyof A]: A[K] extends Function
		? A[K]
		: NarrowRaw<A[K]> })

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-constraint
export type Narrow<A extends any> = Try<A, [], NarrowRaw<A>>
