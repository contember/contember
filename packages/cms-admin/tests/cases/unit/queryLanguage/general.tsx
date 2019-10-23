import { expect } from 'chai'
import { GraphQlBuilder } from '@contember/client'
import 'mocha'
import * as React from 'react'
import { Field, ToOne } from '../../../../src/binding/coreComponents'
import { Environment } from '../../../../src/binding/dao'
import { QueryLanguage } from '../../../../src/binding/queryLanguage'

describe('query language parser', () => {
	it('should resolve variables adhering to the principle maximal munch', () => {
		const environment = Environment.create({
			ab: 456,
			a: 123,
			x: 'x',
			fieldVariable: 'fieldVariableName',
			literal: new GraphQlBuilder.Literal('literal'),
			dimensions: {},
		})
		expect(
			QueryLanguage.wrapRelativeSingleField(
				'a(a=$a).$fieldVariable(ab = $ab, literalColumn = $literal).x(x = $x).foo',
				environment,
			),
		).eql(
			<ToOne.AtomicPrimitive field="a" reducedBy={{ a: 123 }}>
				<ToOne.AtomicPrimitive
					field="fieldVariableName"
					reducedBy={{ ab: 456, literalColumn: new GraphQlBuilder.Literal('literal') }}
				>
					<ToOne.AtomicPrimitive field="x" reducedBy={{ x: 'x' }}>
						<Field name="foo" />
					</ToOne.AtomicPrimitive>
				</ToOne.AtomicPrimitive>
			</ToOne.AtomicPrimitive>,
		)
	})
})
