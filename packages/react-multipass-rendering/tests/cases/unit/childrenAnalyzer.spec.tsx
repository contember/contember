import { expect, it, describe } from 'vitest'
import type { FunctionComponent, ReactElement, ReactNode } from 'react'
import * as React from 'react'
import { BranchNode, ChildrenAnalyzer, Leaf, RawNodeRepresentation } from '../../../src'

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

type Op = 'plus' | 'minus' | 'times'

interface CalculatorBranchNodeProps {
	op: Op
	children: ReactNode
}
const CalculatorBranchNode = (props: CalculatorBranchNodeProps) => null
CalculatorBranchNode.compute = (props: CalculatorBranchNodeProps, [operand1, operand2]: [number, number]) => {
	if (props.op === 'plus') {
		return operand1 + operand2
	} else if (props.op === 'minus') {
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
		<CalculatorBranchNode op="times">
			<NumberComponent value={10} />
			<CalculatorBranchNode op="plus">
				<CalculatorBranchNode op="minus">
					<NumberComponent value={5} />
					<NumberComponent value={3} />
				</CalculatorBranchNode>
				<CalculatorBranchNode op="times">
					<NumberComponent value={2} />
					<NumberComponent value={6} />
				</CalculatorBranchNode>
			</CalculatorBranchNode>
		</CalculatorBranchNode>
	</>
)

describe('children analyzer', () => {
	it('should gather children props', () => {
		const fooLeaf = new Leaf<FooComponentProps>(node => (node as ReactElement<FooComponentProps>).props)
		const analyzer = new ChildrenAnalyzer<FooComponentProps>([fooLeaf])

		expect(analyzer.processChildren(simpleFooComponentTree, undefined)).toEqual([
			{ foo: 'abc', baz: 123 },
			{ foo: 'def', baz: 456 },
			{ foo: 'ghi', baz: 789 },
		])
	})
	it('should filter leaves by component type', () => {
		const fooLeaf = new Leaf(node => node.props, FooComponent)
		const barLeaf = new Leaf((node): BarComponentProps => {
			const props = node.props
			return {
				bar: `${props.bar}${props.bar}`,
				baz: props.baz + 1,
			}
		}, BarComponent)
		const analyzer = new ChildrenAnalyzer<FooComponentProps | BarComponentProps>([fooLeaf, barLeaf])

		expect(analyzer.processChildren(simpleFooBarComponentTree, undefined)).toEqual([
			{ foo: 'abc', baz: 123 },
			{ bar: 'pqrpqr', baz: 370 },
			{ foo: 'ghi', baz: 789 },
		])
	})
	it('should correctly process leaves & branch nodes', () => {
		const numberLeaf = new Leaf(node => node.props.value, NumberComponent)
		const calculatorBranchNode = new BranchNode(
			'compute',
			(children: RawNodeRepresentation<number, number>): [number, number] => {
				if (!children || typeof children === 'number' || children.length !== 2) {
					throw new Error('We only support binary ops')
				}
				return [children[0], children[1]]
			},
		)
		const analyser = new ChildrenAnalyzer<number, number>([numberLeaf], [calculatorBranchNode])
		expect(analyser.processChildren(calculatorFormula, undefined)).toEqual([140])
	})
	it('should not ignore unhandled nodes when appropriate', () => {
		const fooLeaf = new Leaf(node => node.props, FooComponent)
		const Container: FunctionComponent<{ children: ReactNode }> = props => <>{props.children}</>
		;(Container as any).staticRender = (props: any) => props.children

		const analyzer = new ChildrenAnalyzer<FooComponentProps>([fooLeaf], {
			ignoreUnhandledNodes: false,
			staticRenderFactoryName: 'staticRender',
			unhandledNodeErrorMessage: 'Only foo children are supported.',
		})

		const RendersIgnoredNodes1: FunctionComponent<{ children?: ReactNode }> = props => <>{props.children}</>
		const RendersIgnoredNodes2: FunctionComponent<{ children?: ReactNode }> = props => <>{props.children}</>
		;(RendersIgnoredNodes1 as any).staticRender = () => (
			<>
				{null}
				{[null, false]}
			</>
		)
		;(RendersIgnoredNodes2 as any).staticRender = () => null

		const nodesToBeIgnoredAnyway = (
			<>
				<RendersIgnoredNodes1 />
				<RendersIgnoredNodes2 />
				{[<RendersIgnoredNodes1 key={1} />, <RendersIgnoredNodes2 key={2} />]}
				{void 0}
				<></>
				{null}
				{/* */}
				{false}
			</>
		)
		const nodes = (
			<>
				<>
					<Container>
						{nodesToBeIgnoredAnyway}
						<>
							<FooComponent foo="123" baz={123} />
							<FooComponent foo="456" baz={456} />
						</>
						<FooComponent foo="789" baz={789} />
						<Container>
							<FooComponent foo="135" baz={135} />
						</Container>
					</Container>
				</>
			</>
		)

		expect(analyzer.processChildren(nodes, undefined)).toEqual([
			{ foo: '123', baz: 123 },
			{ foo: '456', baz: 456 },
			{ foo: '789', baz: 789 },
			{ foo: '135', baz: 135 },
		])
	})
	it('should process arbitrary nodes and support catch-all leaves', () => {
		const fooLeaf = new Leaf(node => node.props, FooComponent)
		const catchAllLef = new Leaf<any>(node => node)

		const analyzer = new ChildrenAnalyzer([fooLeaf, catchAllLef])

		const nodes = (
			<>
				<>
					{0}
					{123}
					<FooComponent foo="123" baz={123} />
					bar<a href="#baz">baz</a>
					<FooComponent foo="456" baz={456} />
					<br />
					<FooComponent foo="789" baz={789} />
				</>
			</>
		)

		expect(analyzer.processChildren(nodes, undefined)).toEqual([
			0,
			123,
			{ foo: '123', baz: 123 },
			'bar',
			// eslint-disable-next-line react/jsx-key
			<a href="#baz">baz</a>,
			{ foo: '456', baz: 456 },
			// eslint-disable-next-line react/jsx-key
			<br />,
			{ foo: '789', baz: 789 },
		])
	})
})
