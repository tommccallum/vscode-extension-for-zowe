/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

const gulp = require('gulp');
const filter = require('gulp-filter');
const path = require('path');

const ts = require('gulp-typescript');
const typescript = require('typescript');
const sourcemaps = require('gulp-sourcemaps');
const del = require('del');
const runSequence = require('run-sequence');
const es = require('event-stream');
const vsce = require('vsce');
const nls = require('vscode-nls-dev');

const tsProject = ts.createProject('./tsconfig.json', { typescript });

const inlineMap = true;
const inlineSource = false;
const outDest = 'out';

// If all VS Code languages are supported, you can use nls.coreLanguages
// For new languages, add { folderName: 'ISO-639-3-Code-for-language', id: 'vscode-locale-id' } to array below
// Ex. for Chinese add: { folderName: 'zho', id: 'zh-cn' }
/* ************************* ADD NEW LANGUAGES HERE ******************************** */
const languages = [{folderName: 'fra', id: 'fr'}];
/* ********************************************************************************* */
const cleanTask = function() {
	return del(['out/**', 'package.nls.*.json', 'vscode-extension-for-zowe*.vsix']);
}

const internalCompileTask = function() {
	return doCompile(false);
};

const internalNlsCompileTask = function() {
	return doCompile(true);
};

const addI18nTask = function() {
	return gulp.src(['package.nls.json'])
		.pipe(nls.createAdditionalLanguageFiles(languages, 'i18n'))
		.pipe(gulp.dest('.'));
};

const doCompile = function (buildNls) {
	var r = tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject()).js
		.pipe(buildNls ? nls.rewriteLocalizeCalls() : es.through())
		.pipe(buildNls ? nls.createAdditionalLanguageFiles(languages, 'i18n') : es.through());

	if (inlineMap && inlineSource) {
		r = r.pipe(sourcemaps.write());
	} else {
		r = r.pipe(sourcemaps.write("../out", {
			// no inlined source
			includeContent: inlineSource,
			// Return relative source map root directories per file.
			sourceRoot: "../src"
		}));
	}

	return r.pipe(gulp.dest(outDest));
}

const generateSrcLocBundle = () => {
	// Transpile the TS to JS, and let vscode-nls-dev scan the files for calls to localize
	// PROJECT ID is "<PUBLISHER>.<NAME>" (found in package.json)
	return tsProject.src()
		.pipe(sourcemaps.init())
		.pipe(tsProject()).js
        .pipe(nls.createMetaDataFiles())
        .pipe(createAdditionalLanguageFiles(languages, "i18n"))
		.pipe(nls.bundleMetaDataFiles('Zowe.vscode-extension-for-zowe', 'out'))
		.pipe(nls.bundleLanguageFiles())
		.pipe(filter(['**/nls.bundle.*.json', '**/nls.metadata.header.json', '**/nls.metadata.json']))
		.pipe(gulp.dest('out'));
}

const localizationTask = gulp.series(cleanTask, generateSrcLocBundle, addI18nTask);

const buildTask = gulp.series(localizationTask);

const vscePublishTask = function() {
	return vsce.publish();
};

const vscePackageTask = function() {
	return vsce.createVSIX();
};



gulp.task('default', buildTask);

gulp.task('clean', cleanTask);

gulp.task('compile', gulp.series(cleanTask, internalCompileTask));

gulp.task('build', buildTask);

gulp.task('localization', localizationTask);

gulp.task('publish', gulp.series(buildTask, vscePublishTask));

gulp.task('package', gulp.series(buildTask, vscePackageTask));