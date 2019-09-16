import { Terminal, ValidFactoryName } from './nodeSpecs'

export type TerminalList<RepresentationUnion, Environment> = Terminal<
	Environment,
	ValidFactoryName,
	RepresentationUnion,
	any
>[]
