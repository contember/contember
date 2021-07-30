import { whereToFilter, GraphQlBuilder } from '../../../src'

describe('whereToFilter', () => {
	it('complex by', () => {
		expect(
			whereToFilter({
				foo: {
					bar: {
						baz: '123',
						xyz: 456,
					},
					abc: new GraphQlBuilder.GraphQlLiteral('myLiteral'),
				},
			}),
		).toEqual({
			foo: {
				bar: {
					baz: { eq: '123' },
					xyz: { eq: 456 },
				},
				abc: { eq: new GraphQlBuilder.GraphQlLiteral('myLiteral') },
			},
		})
	})
})
