import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		All your active sessions for {{email}} were signed out by an administrator.
		{{#reason}}<br>Reason: {{reason}}{{/reason}}
	</p>
	<p>If you believe this was a mistake, please contact your administrator.</p>
`)
