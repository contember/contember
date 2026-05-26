/**
 * Algolia DocSearch — embedded as the framework-agnostic `@docsearch/js`
 * widget loaded from the jsDelivr CDN. It targets the same Algolia app and
 * index the Docusaurus theme used, so the existing crawler/index keep working
 * unchanged; only the search UI is now ours.
 *
 * The matching CSS is linked in <head> (see DocLayout).
 */
const INIT_SCRIPT = `
import docsearch from 'https://cdn.jsdelivr.net/npm/@docsearch/js@3/dist/esm/index.js';
docsearch({
	container: '#docsearch',
	appId: 'J1HMGG24O1',
	apiKey: 'efb29dbb8730f33e7525ec6375ffc60d',
	indexName: 'docs-contember',
});
`

export default function Search() {
	return (
		<>
			<div id="docsearch" className="navbar__search" />
			<script type="module" dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
		</>
	)
}
