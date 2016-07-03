import $ from 'koa-route';
import bundler from './bundler';
import middleware from './middleware';
import { unindent } from '../../utils';

/* Define the head content for the html page */
let head = unindent `
	<title>Youtube Archive</title>
	<meta charset="utf-8">

	<script src="/api"></script>
	<link rel='stylesheet' type='text/css' href='https://fonts.googleapis.com/css?family=Open+Sans:400,300,700,600,800,300italic,400italic,600italic,700italic,800italic'>
	<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/4.2.0/normalize.min.css">
`;

/*
 * This component is responsible for compiling and serving all the applications views.
 * It uses `views/app.vue` as an entrypoint. This vue component should be equipped with a
 * `router` property so we can set up server-side routing properly.
 */
export default async function views(app) {
	await app.middleware;
	let api = await app.api;
	let koa = await app.webserver;

	/* Compile the bundle */
	let {css, clientJs, serverJs} = await bundler(app)();

	/* Output the clientside code on the corresponding routes */
	koa.use($.get('/view-css', ctx => { ctx.body = css(); ctx.type = 'text/css'; }));
	koa.use($.get('/view-js', ctx => { ctx.body = clientJs(); ctx.type = 'application/javascript'; }));

	/* Attach the routing / rendering middleware */
	koa.use(middleware(head, serverJs, api));
}
