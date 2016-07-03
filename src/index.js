#!/usr/bin/env node
import fs from 'fs';
import App from '@paulavery/app';

let app = new App('youtube-archive');
/* TODO: pull into app module */ process.env.NODE_ENV = app.env;
/* TODO: pull into app module */ if(app.env !== 'production') require('longjohn');

/* Load all components from the subdirectory */
fs.readdirSync(__dirname + '/components').forEach(component => {
	app.register(require('./components/' + component).default);
});

app.boot();
