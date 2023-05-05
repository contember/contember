import { AssertionError } from './AssertionError'

export function assert<
	In,
	Out extends In
>(
	that: string | undefined = undefined,
	value: In,
	predicate: (value: In) => value is Out,
): asserts value is Out {
	if (!predicate(value)) {
		throw new AssertionError(value, that)
	}
}
