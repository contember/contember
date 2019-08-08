export async function* readLines(reader: ReadableStreamDefaultReader): AsyncIterable<string> {
	const decoder = new TextDecoder()
	let buffer = ''
	while (true) {
		const input = await reader.read()
		if (input.done) {
			break
		}
		const chunk = decoder.decode(input.value, { stream: true })
		for (let pos = 0; pos < chunk.length; pos++) {
			const char = chunk.charAt(pos)
			if (char === '\r' || char === '\n') {
				yield buffer
				buffer = ''
				if (char === '\r' && chunk.charAt(pos + 1) === '\n') {
					pos++
				}
				continue
			}
			buffer += char
		}
	}
}

export async function* readEventStream(
	lines: AsyncIterable<string>,
): AsyncIterable<{ data: string; lastEventId?: string }> {
	let lastEventId: string | undefined = undefined
	let dataBuffer = ''
	for await (let line of lines) {
		if (line === '') {
			yield { data: dataBuffer, lastEventId }
		}
		if (line.charAt(0) === ':') {
			continue
		}
		const pos = line.indexOf(':')
		let [field, value] = pos > 0 ? [line.substr(0, pos), line.substr(pos + 1)] : [line, '']
		if (value.charAt(0) === ' ') {
			value = value.substr(1)
		}
		if (field === 'id') {
			lastEventId = value
		}
		if (field === 'data') {
			dataBuffer = value
		}
	}
}
