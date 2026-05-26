import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		please confirm your e-mail address ({{email}}):<br>
		Copy &amp; paste the following token and follow the instructions in the e-mail verification interface:<br>
		<code>{{token}}</code>
	</p>
`)
