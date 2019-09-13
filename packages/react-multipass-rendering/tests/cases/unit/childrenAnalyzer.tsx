import 'jasmine'
import * as React from 'react'
import { ChildrenAnalyzer, Nonterminal, RawNodeRepresentation, Terminal } from '../../../src'

interface FooComponentProps {
	foo: string
	baz: number
}
interface BarComponentProps {
	bar: string
	baz: number
}

const FooComponent = (props: FooComponentProps) => null
const BarComponent = (props: BarComponentProps) => null

const simpleFooComponentTree = (
	<>
		<>
			{/* This is to also test that fragments are properly ignored */}
			<FooComponent foo="abc" baz={123} />
		</>
		<FooComponent foo="def" baz={456} />
		<FooComponent foo="ghi" baz={789} />
	</>
)
const simpleFooBarComponentTree = (
	<>
		<FooComponent foo="abc" baz={123} />
		<BarComponent bar="pqr" baz={369} />
		<FooComponent foo="ghi" baz={789} />
	</>
)

enum Op {
	Plus,
	Minus,
	Times,
}
interface CalculatorNonterminalProps {
	op: number
	children: React.ReactNode
}
const CalculatorNonterminal = (props: CalculatorNonterminalProps) => null
CalculatorNonterminal.compute = (props: CalculatorNonterminalProps, [operand1, operand2]: [number, number]) => {
	if (props.op === Op.Plus) {
		return operand1 + operand2
	} else if (props.op === Op.Minus) {
		return operand1 - operand2
	}
	return operand1 * operand2
}

interface NumberComponentProps {
	value: number
}
const NumberComponent = (props: NumberComponentProps) => null

const calculatorFormula = ( // 10 * ((5 - 3) + (2 * 6)) === 140
	<>
		<CalculatorNonterminal op={Op.Times}>
			<NumberComponent value={10} />
			<CalculatorNonterminal op={Op.Plus}>
				<CalculatorNonterminal op={Op.Minus}>
					<NumberComponent value={5} />
					<NumberComponent value={3} />
				</CalculatorNonterminal>
				<CalculatorNonterminal op={Op.Times}>
					<NumberComponent value={2} />
					<NumberComponent value={6} />
				</CalculatorNonterminal>
			</CalculatorNonterminal>
		</CalculatorNonterminal>
	</>
)

describe('children analyzer', () => {
	it('should gather children props', () => {
		const fooTerminal = new Terminal((props: FooComponentProps): FooComponentProps => props)
		const analyzer = new ChildrenAnalyzer<FooComponentProps>([fooTerminal])

		expect(analyzer.processChildren(simpleFooComponentTree, undefined)).toEqual([
			{ foo: 'abc', baz: 123 },
			{ foo: 'def', baz: 456 },
			{ foo: 'ghi', baz: 789 },
		])
	})
	it('should filter terminals by component type', () => {
		const fooTerminal = new Terminal((props: FooComponentProps): FooComponentProps => props, FooComponent)
		const barTerminal = new Terminal(
			(props: BarComponentProps): BarComponentProps => ({
				bar: `${props.bar}${props.bar}`,
				baz: props.baz + 1,
			}),
			BarComponent,
		)
		const analyzer = new ChildrenAnalyzer<FooComponentProps | BarComponentProps>([fooTerminal, barTerminal])

		expect(analyzer.processChildren(simpleFooBarComponentTree, undefined)).toEqual([
			{ foo: 'abc', baz: 123 },
			{ bar: 'pqrpqr', baz: 370 },
			{ foo: 'ghi', baz: 789 },
		])
	})
	it('should correctly process terminals & nonterminals', () => {
		const numberTerminal = new Terminal((props: NumberComponentProps) => props.value, NumberComponent)
		const calculatorNonterminal = new Nonterminal('compute', (children: RawNodeRepresentation<number, number>): [
			number,
			number,
		] => {
			if (!children || typeof children === 'number' || children.length !== 2) {
				throw new Error('We only support binary ops')
			}
			return [children[0], children[1]]
		})
		const analyser = new ChildrenAnalyzer<number, number>([numberTerminal], [calculatorNonterminal])
		expect(analyser.processChildren(calculatorFormula, undefined)).toEqual([140])
	})
})
