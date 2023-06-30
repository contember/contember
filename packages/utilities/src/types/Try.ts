export type Try<A1, A2, Catch = never> =
	A1 extends A2
	? A1
	: Catch
