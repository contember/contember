import { describe, expect, test } from 'vitest'
import { listClassName } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.listClassName', function () {
		expect(listClassName(['a', 'b'])).equals('a b')
		expect(listClassName(['a', null, 'b'])).equals('a b')
		expect(listClassName(['a', undefined, 'b'])).equals('a b')
		expect(listClassName(['a', 'b', undefined])).equals('a b')
		expect(listClassName(['a', 'b', null])).equals('a b')
		expect(listClassName(['a', undefined, 'b', null])).equals('a b')
		expect(listClassName(['a', null, 'b', undefined])).equals('a b')
		expect(listClassName(['a', null, undefined, 'b'])).equals('a b')
		expect(listClassName([undefined, 'a', null, 'b'])).equals('a b')
		expect(listClassName([null, 'a', undefined, 'b'])).equals('a b')
		expect(listClassName([null, 'a', null, 'b'])).equals('a b')
		expect(listClassName([undefined, 'a', undefined, 'b'])).equals('a b')
		expect(listClassName(['a', 'a', 'b', 'b'])).equals('a b')
		expect(listClassName(['a', 'a', 'b', 'b', 'c'])).equals('a b c')
		expect(listClassName(['a', 'a', 'b', 'b', 'c', 'c'])).equals('a b c')
		expect(listClassName(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'])).equals('a b c d e f g h i j k l m n o p q r s t u v w x y z')
		expect(listClassName(['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd', 'e', 'e', 'f', 'f', 'g', 'g', 'h', 'h', 'i', 'i', 'j', 'j', 'k', 'k', 'l', 'l', 'm', 'm', 'n', 'n', 'o', 'o', 'p', 'p', 'q', 'q', 'r', 'r', 's', 's', 't', 't', 'u', 'u', 'v', 'v', 'w', 'w', 'x', 'x', 'y', 'y', 'z', 'z'])).equals('a b c d e f g h i j k l m n o p q r s t u v w x y z')
	})
})
