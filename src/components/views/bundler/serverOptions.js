import path from 'path';

/* Options for the server webpack bundle */
export default () => {
	return {
		name: 'server',
		entry: path.join(__dirname, '../entries/server.js'),
		target: 'node',
		devtool: 'inline-source-map',
		output: {
			path: '/',
			filename: 'server.js',
			libraryTarget: 'commonjs'
		},
		module: {
			loaders: [{
				test: /\.vue$/,
				loader: 'vue'
			}, {
				test: /\.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader'
			}]
		}
	};
};
