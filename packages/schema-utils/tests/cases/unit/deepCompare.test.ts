import { expect, describe, test } from 'bun:test'
import { compareArraysIgnoreOrder } from '../../../src'

describe('deep compare', () => {
	test('compare array ignore order - success', () => {
		const actual = compareArraysIgnoreOrder([
			{ foo: 'bar' },
			{ lorem: 'ipsum' },
		], [
			{ lorem: 'ipsum' },
			{ foo: 'bar' },
		], [])
		expect(actual).toStrictEqual([])
	})

	test('compare array ignore order - missing in A', () => {
		const actual = compareArraysIgnoreOrder([
			{ lorem: 'ipsum' },
			{ lorem: 'ipsum' },
		], [
			{ lorem: 'ipsum' },
			{ foo: 'bar' },
		], [])
		expect(actual).toStrictEqual([{
			path: [],
			message: 'Array item: {"lorem":"ipsum"} not found in [{"foo":"bar"}]',
		}])
	})

	test('compare array ignore order - missing in B', () => {
		const actual = compareArraysIgnoreOrder([
			{ foo: 'bar' },
			{ lorem: 'ipsum' },
		], [
			{ lorem: 'ipsum' },
			{ lorem: 'ipsum' },
		], [])
		expect(actual).toStrictEqual([{
			path: [],
			message: 'Array item: {"foo":"bar"} not found in [{"lorem":"ipsum"},{"lorem":"ipsum"}]',
		}],
		)
	})
})
