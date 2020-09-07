declare module 'picomatch' {
	export type Matcher = (subject: string) => boolean
	export default function (pattern: string): Matcher
	export function makeRe(pattern: string): RegExp
}
