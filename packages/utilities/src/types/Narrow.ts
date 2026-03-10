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
	| ({
		[K in keyof A]: A[K] extends Function ? A[K]
			: NarrowRaw<A[K]>
	})

export type Narrow<A> = A extends [] ? A : NarrowRaw<A>
