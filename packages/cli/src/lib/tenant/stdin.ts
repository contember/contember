/** Reads the whole stdin. Injected into the commands so a test never has to touch the real stream. */
export type StdinReader = () => Promise<string>

/**
 * Reads stdin to the end, verbatim. Only ever reached behind an explicit `--*-stdin` flag, so a normal
 * run never blocks on it — a command that reads stdin "just in case" hangs every non-TTY caller.
 */
export const readStdinText: StdinReader = async () => {
	const stream: AsyncIterable<string | Uint8Array> = process.stdin
	const decoder = new TextDecoder()
	let text = ''
	for await (const chunk of stream) {
		text += typeof chunk === 'string' ? chunk : decoder.decode(chunk, { stream: true })
	}
	return text + decoder.decode()
}
