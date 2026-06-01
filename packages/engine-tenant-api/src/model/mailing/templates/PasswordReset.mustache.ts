import Layout from './Layout.mustache.js'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		password reset was requested for your account ({{email}}):<br>
		Copy & paste following token and follow instructions in password reset interface:<br>
		<code>{{token}}</code>
	</p>
`)
