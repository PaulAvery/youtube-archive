/*
 * This file contains a set of utility methods for all components
 * Stuff that **might** make sense in a utility lib at some later stage
 */
import fs from 'fs';
import path from 'path';

/**
 * Small utility to convert a callback function to a promise:
 * promise(cb => asyncMethod(cb)).then();
 */
export let promise = cb => new Promise((s, f) => cb((e, d) => e ? f(e) : s(d)));

/**
 * Create a youtube url from an id
 */
export let idToUrl = id => `https://www.youtube.com/watch?v=${id}`;

/**
 * Require a js string. Be very careful with this,
 * as this allows arbitrary code execution
 */
export let requireString = (src, dir) => {
	let Module = module.constructor;
	let filename = path.join(dir, 'string.js');

	let m = new Module(filename, module.parent);
	m.paths = Module._nodeModulePaths(path.dirname(filename));
	m.filename = filename;
	m._compile(src, filename);

	return m.exports;
};

/**
 * A user error class, so we know we can show this to the user
 */
export class UserError extends Error {}

/**
 * Check if a file exists
 * Used because fs.exists is deprecated
 */
export async function exists(pth) {
	try {
		await promise(cb => fs.access(pth, fs.constants.F_OK, cb));

		return true;
	} catch(e) {
		return false;
	}
}

/**
 * Serialize an error. If it is a user error returns the message,
 * otherwise returns "Unknown Error"
 */
export function serializeError(e) {
	if(e instanceof UserError) {
		return e.message;
	} else {
		return 'Unknown Error';
	}
}

/**
 * Tag to be used with template strings to unindent them a set amount of characters
 * It skips the first and last lines, so it basically expects something like:
 *
 *     unindent `
 *         <div>
 *             <h1>Hi, I will be indented by 4 spaces</h1>
 *         </div>
 *     `
 *
 * This will result in:
 *
 *     <div>
 *         <h1>Hi, I will be indented by 4 spaces</h1>
 *     </div>
 *
 */
export function unindent(rawStrings, ...values) {
	let strings = rawStrings.concat([]);

	/* How far is evrything indented? */
	let count = strings[0].split('\n')[1].match(/^\s*/g)[0].length;

	/* Remove the first and last linebreaks */
	strings[0] = strings[0].slice(1);
	strings[strings.length - 1] = strings[strings.length - 1].slice(0, -1);

	/* Remove the indents off the strings */
	strings = strings.map(string => {
		let lines = string.split('\n');

		/* Only remove all but the first lines indents */
		return lines.slice(0, 1).concat(lines.slice(1).map(l => l.slice(count))).join('\n');
	});

	/* Stick it all together */
	let result = strings[0].slice(count);
	for(let i = 1; i < strings.length; i++) {
		result += values[i - 1] + strings[i];
	}

	/* Append the last string and ret */
	return result;
}
