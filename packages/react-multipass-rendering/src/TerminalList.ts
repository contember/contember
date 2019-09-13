import { Terminal, ValidFactoryName } from './nodeSpecs'

export type TerminalList<RepresentationUnion, Environment> = Terminal<
	ValidFactoryName,
	{},
	RepresentationUnion,
	any,
	Environment
>[]
