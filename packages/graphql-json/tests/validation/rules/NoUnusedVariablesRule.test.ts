import { describe, it } from 'bun:test'

import { NoUnusedVariablesRule as GraphQLJsNoUnusedVariablesRule } from 'graphql'
import { NoUnusedVariablesRule } from '../../../src/index.js'

import { expectValidationErrors, type RulePair } from './harness.js'

const rule: RulePair = [NoUnusedVariablesRule, GraphQLJsNoUnusedVariablesRule]

function expectErrors(queryStr: string) {
	return expectValidationErrors(rule, queryStr)
}

function expectValid(queryStr: string) {
	expectErrors(queryStr).toEqual([])
}

describe('Validate: No unused variables', () => {
	it('uses all variables', () => {
		expectValid(`
      query ($a: String, $b: String, $c: String) {
        field(a: $a, b: $b, c: $c)
      }
    `)
	})

	it('uses all variables deeply', () => {
		expectValid(`
      query Foo($a: String, $b: String, $c: String) {
        field(a: $a) {
          field(b: $b) {
            field(c: $c)
          }
        }
      }
    `)
	})

	it('uses all variables deeply in inline fragments', () => {
		expectValid(`
      query Foo($a: String, $b: String, $c: String) {
        ... on Type {
          field(a: $a) {
            field(b: $b) {
              ... on Type {
                field(c: $c)
              }
            }
          }
        }
      }
    `)
	})

	it('uses all variables in fragments', () => {
		expectValid(`
      query Foo($a: String, $b: String, $c: String) {
        ...FragA
      }
      fragment FragA on Type {
        field(a: $a) {
          ...FragB
        }
      }
      fragment FragB on Type {
        field(b: $b) {
          ...FragC
        }
      }
      fragment FragC on Type {
        field(c: $c)
      }
    `)
	})

	it('variable used by fragment in multiple operations', () => {
		expectValid(`
      query Foo($a: String) {
        ...FragA
      }
      query Bar($b: String) {
        ...FragB
      }
      fragment FragA on Type {
        field(a: $a)
      }
      fragment FragB on Type {
        field(b: $b)
      }
    `)
	})

	it('variable used by recursive fragment', () => {
		expectValid(`
      query Foo($a: String) {
        ...FragA
      }
      fragment FragA on Type {
        field(a: $a) {
          ...FragA
        }
      }
    `)
	})

	it('variable not used', () => {
		expectErrors(`
      query ($a: String, $b: String, $c: String) {
        field(a: $a, b: $b)
      }
    `).toEqual([
			{
				message: 'Variable "$c" is never used.',
				locations: [{ line: 2, column: 38 }],
			},
		])
	})

	it('multiple variables not used', () => {
		expectErrors(`
      query Foo($a: String, $b: String, $c: String) {
        field(b: $b)
      }
    `).toEqual([
			{
				message: 'Variable "$a" is never used in operation "Foo".',
				locations: [{ line: 2, column: 17 }],
			},
			{
				message: 'Variable "$c" is never used in operation "Foo".',
				locations: [{ line: 2, column: 41 }],
			},
		])
	})

	it('variable not used in fragments', () => {
		expectErrors(`
      query Foo($a: String, $b: String, $c: String) {
        ...FragA
      }
      fragment FragA on Type {
        field(a: $a) {
          ...FragB
        }
      }
      fragment FragB on Type {
        field(b: $b) {
          ...FragC
        }
      }
      fragment FragC on Type {
        field
      }
    `).toEqual([
			{
				message: 'Variable "$c" is never used in operation "Foo".',
				locations: [{ line: 2, column: 41 }],
			},
		])
	})

	it('multiple variables not used in fragments', () => {
		expectErrors(`
      query Foo($a: String, $b: String, $c: String) {
        ...FragA
      }
      fragment FragA on Type {
        field {
          ...FragB
        }
      }
      fragment FragB on Type {
        field(b: $b) {
          ...FragC
        }
      }
      fragment FragC on Type {
        field
      }
    `).toEqual([
			{
				message: 'Variable "$a" is never used in operation "Foo".',
				locations: [{ line: 2, column: 17 }],
			},
			{
				message: 'Variable "$c" is never used in operation "Foo".',
				locations: [{ line: 2, column: 41 }],
			},
		])
	})

	it('variable not used by unreferenced fragment', () => {
		expectErrors(`
      query Foo($b: String) {
        ...FragA
      }
      fragment FragA on Type {
        field(a: $a)
      }
      fragment FragB on Type {
        field(b: $b)
      }
    `).toEqual([
			{
				message: 'Variable "$b" is never used in operation "Foo".',
				locations: [{ line: 2, column: 17 }],
			},
		])
	})

	it('variable not used by fragment used by other operation', () => {
		expectErrors(`
      query Foo($b: String) {
        ...FragA
      }
      query Bar($a: String) {
        ...FragB
      }
      fragment FragA on Type {
        field(a: $a)
      }
      fragment FragB on Type {
        field(b: $b)
      }
    `).toEqual([
			{
				message: 'Variable "$b" is never used in operation "Foo".',
				locations: [{ line: 2, column: 17 }],
			},
			{
				message: 'Variable "$a" is never used in operation "Bar".',
				locations: [{ line: 5, column: 17 }],
			},
		])
	})
})
