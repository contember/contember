import { Nonterminal, ValidFactoryName } from './nodeSpecs'
import { RawNodeRepresentation } from './nodeSpecs/RawNodeRepresentation'

export type NonterminalList<TerminalsRepresentationUnion, NonterminalsRepresentationUnion, Environment> = Nonterminal<
	ValidFactoryName,
	{},
	RawNodeRepresentation<TerminalsRepresentationUnion, NonterminalsRepresentationUnion>,
	any,
	NonterminalsRepresentationUnion,
	any,
	Environment
>[]
