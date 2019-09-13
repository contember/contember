import { Nonterminal, RawNodeRepresentation, ValidFactoryName } from './nodeSpecs'

export type NonterminalList<TerminalsRepresentationUnion, NonterminalsRepresentationUnion, Environment> = Nonterminal<
	ValidFactoryName,
	any,
	RawNodeRepresentation<TerminalsRepresentationUnion, NonterminalsRepresentationUnion>,
	any,
	NonterminalsRepresentationUnion,
	Environment
>[]
