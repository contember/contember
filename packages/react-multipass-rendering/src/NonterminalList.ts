import { Nonterminal, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs'

export type NonterminalList<TerminalsRepresentationUnion, NonterminalsRepresentationUnion, Environment> = Nonterminal<
	Environment,
	ValidFactoryName,
	any,
	RawNodeRepresentation<TerminalsRepresentationUnion, NonterminalsRepresentationUnion>,
	any,
	NonterminalsRepresentationUnion
>[]
