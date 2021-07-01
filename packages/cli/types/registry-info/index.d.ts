declare module 'registry-info' {
	export default function getRegistryInfo(scope: string | null): {
		registryUrl: string
		authToken: string
		authorization: string
	}
}
