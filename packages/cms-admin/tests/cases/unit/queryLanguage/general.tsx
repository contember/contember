import { expect } from 'chai'
import 'mocha'
import { GraphQlBuilder } from 'cms-client'
import * as React from 'react'
import { ToOne } from '../../../../src/binding/coreComponents'
import { Environment } from '../../../../src/binding/dao'
import { TextField } from '../../../../src/binding/facade'
import { QueryLanguage } from '../../../../src/binding/queryLanguage'

describe('query language parser', () => {
	it('should resolve variables adhering to the principle maximal munch', () => {
		const environment = new Environment({
			ab: 456,
			a: 123,
			x: 'x',
			fieldVariable: 'fieldVariableName',
			literal: new GraphQlBuilder.Literal('literal'),
			dimensions: {}
		})
		expect(
			QueryLanguage.wrapRelativeSingleField(
				'a(a=$a).$fieldVariable(ab = $ab, literalColumn = $literal).x(x = $x).foo',
				name => <TextField name={name} />,
				environment
			)
		).eql(
			<ToOne.AtomicPrimitive field="a" reducedBy={{ a: 123 }} environment={environment}>
				<ToOne.AtomicPrimitive
					field="fieldVariableName"
					reducedBy={{ ab: 456, literalColumn: new GraphQlBuilder.Literal('literal') }}
					environment={environment}
				>
					<ToOne.AtomicPrimitive field="x" reducedBy={{ x: 'x' }} environment={environment}>
						<TextField name="foo" />
					</ToOne.AtomicPrimitive>
				</ToOne.AtomicPrimitive>
			</ToOne.AtomicPrimitive>
		)
	})
})
