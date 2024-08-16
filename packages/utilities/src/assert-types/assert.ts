import { AssertionError } from './AssertionError'
import { Predicate } from './types'

export function assert<
	In,
	Out extends In
>(
	that: string | undefined = undefined,
	value: In,
	predicate: Predicate<In, Out>, // (value: In) => value is Out,
): asserts value is Out {
	if (!predicate(value)) {
		throw new AssertionError(value, that)
	}
}
