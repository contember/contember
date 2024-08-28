export const calculateHash = async (algo: AlgorithmIdentifier, message: string): Promise<string> => {
	const hashBuffer = await crypto.subtle.digest(algo, new TextEncoder().encode(message))
	return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}
