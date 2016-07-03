import path from 'path';
import webpack from 'webpack';
import Extractor from 'extract-text-webpack-plugin';

/* Options for the client webpack bundle */
export default production => {
	let options = {
		name: 'client',
		entry: path.join(__dirname, '../entries/client.js'),
		output: {
			path: '/',
			filename: 'client.js'
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
		},
		vue: {
			loaders: {
				css: Extractor.extract('css'),
				sass: Extractor.extract('css!sass')
			}
		},
		plugins: [
			new Extractor('/css'),
			new webpack.DefinePlugin({ 'process.env': { NODE_ENV: `'${process.env.NODE_ENV }'` } })
		]
	};

	/* Optimize the client bundle in production */
	if(production) {
		options.plugins.push(new webpack.optimize.OccurenceOrderPlugin());
	} else {
		options.devtool = 'inline-source-map';
	}

	return options;
};
