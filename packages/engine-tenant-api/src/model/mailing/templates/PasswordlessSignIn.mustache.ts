import Layout from './Layout.mustache'
// language=Mustache
export default Layout(`
	<p>Hello,</p>
	<p>
		sign in was requested for your account ({{email}}):<br>
		{{#url}}
			<p>Click the following link to sign in:</p>
			<a href="{{url}}">{{url}}</a>
		{{/url}}
		{{^url}}
			<p>Passwordless sign-in is misconfigured. Please contact your administrator.</p>
		{{/url}}
	</p>
`)
