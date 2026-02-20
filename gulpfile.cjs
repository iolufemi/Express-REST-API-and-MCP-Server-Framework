'use strict';
var eslint = require('gulp-eslint');
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var debug = require('debug')('gulp');
var todo = require('gulp-todo');
var mocha = require('gulp-mocha');
var _ = require('lodash');

var runSequence = require('run-sequence');
var conventionalChangelog = require('gulp-conventional-changelog');
var conventionalGithubReleaser = require('conventional-github-releaser');
var bump = require('gulp-bump');
var git = require('gulp-git');
var fs = require('fs');
// Config is only used for gitOAuthToken in release tasks, so we can use a default
var config = {
    gitOAuthToken: process.env.GIT_OAUTH_TOKEN || '86d6eb7abe03e8ae6a970cb67622e667c9c0f86a'
};
var argv = require('minimist');



gulp.task('lint', function() {
    return gulp.src(['./src/**/*.ts', './test/**/*.ts', '!./node_modules/**', '!./template/**'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('default', function() {
    var stream = nodemon({ script: 'src/app.ts', exec: 'tsx', env: { 'NODE_ENV': 'development', 'DEBUG': 'gulp' }, tasks: ['lint', 'test'] });

    stream
        .on('restart', function() {
            debug('restarted!');
        })
        .on('crash', function() {
            debug('Application has crashed!\n');
            stream.emit('restart', 10); // restart the server in 10 seconds 
        });
});

gulp.task('test', function() {
    // Override RATE LIMIT HERE FOR UNIT TEST
    // process.env.RATE_LIMIT = 10;
    process.env.SECURE_MODE = true;
    process.env.NO_CACHE = 'no';
    process.env.NODE_ENV = 'test';
    gulp.src('./test', { read: false })
        // `gulp-mocha` needs filepaths so you can't have any plugins before it 
        .pipe(mocha({
            reporter: 'spec'
        }));
});

// Remember to pass argument '--name TheServiceName' or '-n TheServiceName' to the service creation command
// If you want to use an API as a database model, pass the base url and the endpoint. '--baseurl http://google.com' or '--b http://google.com'
// '--endpoint users' or '--e users'
// Note that the name must be singular
gulp.task('service', function(done) {
    var args = argv(process.argv.slice(2));
    var name;
    var baseurl;
    var endpoint;
    var isSQL;
    baseurl = args.baseurl;
    endpoint = args.endpoint;
    if (!baseurl) {
        baseurl = args.b;
    }

    if (!endpoint) {
        endpoint = args.e;
    }

    isSQL = args.sql;

    name = args.name;

    if (!name) {
        name = args.n;
    }

    if (!name) {
        throw new Error('Please, pass the service name using the "-n" argument or "--name" argument');
    }

    // Create plural name for filenames (remove spaces)
    var namePlural = name.replace(/\s+/g, '').toLowerCase() + 's';
    var nameCapitalise = _.capitalize(name);
    var nameCapitalisePlural = _.capitalize(name) + 's';
    var nameLowerCase = _.lowerCase(name);
    // Create camelCase variable name (no spaces) for use in code
    var nameCamelCase = name.replace(/\s+/g, '').replace(/^./, function(str) { return str.toLowerCase(); });
    // MCP registration and test filename (no spaces)
    var registrationBasename = name.replace(/\s+/g, '').toLowerCase();

    // Create the Route
    fs.readFile('./template/route.tmpl', function(err, data) {
        if (err) {
            throw err;
        }
        var tpl = _.template(data);
        var result = tpl({ service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase });

        fs.writeFile('./src/routes/' + namePlural + '.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('Route created at ./src/routes/' + namePlural + '.ts');
        });
    });

    // Create the Route Unit Test
    fs.readFile(isSQL ? './template/route_sql_test.tmpl' : './template/route_test.tmpl', function(err, data) {
        if (err) {
            throw err;
        }
        var tpl = _.template(data);
        var result = tpl({ service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase });

        fs.writeFile('./test/routes/' + namePlural + '.test.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('Route unit test created at ./test/routes/' + namePlural + '.test.ts');
        });
    });

    // Create the Model
    if (baseurl && endpoint) {
        fs.readFile('./template/model_api.tmpl', function(err, data) {
            if (err) {
                throw err;
            }
            var tpl = _.template(data);
            var result = tpl({ 
                baseurl: baseurl, 
                endpoint: endpoint,
                service: nameCapitalise
            });

            fs.writeFile('./src/models/' + nameCapitalisePlural + '.ts', result, function(err) {
                if (err) {
                    throw err;
                }
                console.log('Model created at ./src/models/' + nameCapitalisePlural + '.ts');
            });
        });
    }
    else {
        fs.readFile(isSQL ? './template/model_sql.tmpl' : './template/model.tmpl', function(err, data) {
            if (err) {
                throw err;
            }
            var tpl = _.template(data);
            var result = tpl({ service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase });

            fs.writeFile('./src/models/' + nameCapitalisePlural + '.ts', result, function(err) {
                if (err) {
                    throw err;
                }
                console.log('Model created at ./src/models/' + nameCapitalisePlural + '.ts');
            });
        });
    }

    // Create the Model Unit Test
    fs.readFile(isSQL ? './template/model_sql_test.tmpl' : './template/model_test.tmpl', function(err, data) {
        if (err) {
            throw err;
        }
        var tpl = _.template(data);
        var result = tpl({ service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase });

        fs.writeFile('./test/models/' + namePlural + '.test.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('Model unit test created at ./test/models/' + namePlural + '.test.ts');
        });
    });

    // Create the controller
    fs.readFile(isSQL ? './template/controller_sql.tmpl' : './template/controller.tmpl', function(err, data) {
        if (err) {
            throw err;
        }
        var tpl = _.template(data);
        var result = tpl({ service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase });

        fs.writeFile('./src/controllers/' + nameCapitalisePlural + '.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('Controller created at ./src/controllers/' + nameCapitalisePlural + '.ts');
        });
    });

    // Create the controller Unit test
    fs.readFile(isSQL ? './template/controller_sql_test.tmpl' : './template/controller_test.tmpl', function(err, data) {
        if (err) {
            throw err;
        }
        var tpl = _.template(data);
        var result = tpl({ service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase });

        fs.writeFile('./test/controllers/' + namePlural + '.test.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('Controller unit test created at ./test/controllers/' + namePlural + '.test.ts');
        });
    });

    // Create MCP service registration file
    fs.readFile('./template/mcp_service.tmpl', function(err, data) {
        if (err) {
            // MCP template is optional, don't fail if it doesn't exist
            console.log('MCP service template not found, skipping MCP registration file');
            return done();
        }
        var tpl = _.template(data);
        var result = tpl({ service: nameCapitalise, object: nameLowerCase, serviceLower: nameLowerCase });

        // Ensure mcp/services directory exists
        var mcpServicesDir = './src/mcp/services';
        if (!fs.existsSync(mcpServicesDir)) {
            fs.mkdirSync(mcpServicesDir, { recursive: true });
        }

        fs.writeFile(mcpServicesDir + '/' + registrationBasename + '.registration.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('MCP service registration created at ' + mcpServicesDir + '/' + registrationBasename + '.registration.ts');
        });
    });

    // Create MCP unit test
    fs.readFile('./template/mcp_test.tmpl', function(err, data) {
        if (err) {
            console.log('MCP test template not found, skipping MCP test file');
            return done();
        }
        var tpl = _.template(data);
        var templateData = { service: nameCapitalise, object: nameLowerCase, objectCamelCase: nameCamelCase, registrationBasename: registrationBasename };
        var result = tpl(templateData);

        var mcpTestDir = './test/mcp';
        if (!fs.existsSync(mcpTestDir)) {
            fs.mkdirSync(mcpTestDir, { recursive: true });
        }

        fs.writeFile(mcpTestDir + '/' + namePlural + '.test.ts', result, function(err) {
            if (err) {
                throw err;
            }
            console.log('MCP unit test created at ' + mcpTestDir + '/' + namePlural + '.test.ts');
        });
    });

    return done();

});

// generate a todo.md from your typescript files 
gulp.task('todo', function() {
    gulp.src(['./src/**/*.ts', './test/**/*.ts', '!./node_modules/**'])
        .pipe(todo())
        .pipe(gulp.dest('./'));
    // -> Will output a TODO.md with your todos 
});

gulp.task('sanity', gulp.series('lint', 'test', 'todo'));

// Release

gulp.task('changelog', function() {
    return gulp.src('./CHANGELOG.md', {
        buffer: false
    })
        .pipe(conventionalChangelog({
            preset: 'angular' // Or to any other commit message convention you use.
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('github-release', function(done) {
    conventionalGithubReleaser({
        type: 'oauth',
        token: config.gitOAuthToken // change this to your own GitHub token or use an environment variable
    }, {
        preset: 'angular' // Or to any other commit message convention you use.
    }, done);
});

// Remember to pass argument '-r patch/minor/major' to the release command
gulp.task('bump-version', function() {
    var args = argv(process.argv.slice(2));
    // We hardcode the version change type to 'patch' but it may be a good idea to
    // use minimist (https://www.npmjs.com/package/minimist) to determine with a
    // command argument whether you are doing a 'major', 'minor' or a 'patch' change.
    if (!args.r) {
        throw new Error('The release type is not defined! Please pass the -r switch with a release type argument (patch/minor/major)');
    }
    else {
        return gulp.src(['./package.json'])
            .pipe(bump({ type: args.r }).on('error', function (err) { console.error(err); }))
            .pipe(gulp.dest('./'));
    }
});

gulp.task('commit-changes', function() {
    return gulp.src('.')
        .pipe(git.add())
        .pipe(git.commit('[Prerelease] Bumped version number'));
});

gulp.task('push-changes', function(cb) {
    git.push('origin', 'dev', cb);
});

gulp.task('create-new-tag', function(cb) {
    var getPackageJsonVersion = function() {
        // We parse the json file instead of using require because require caches
        // multiple calls so the version number won't be updated
        return JSON.parse(fs.readFileSync('./package.json', 'utf8')).version;
    };
    var version = getPackageJsonVersion();
    git.tag(version, 'Created Tag for version: ' + version, function(error) {
        if (error) {
            return cb(error);
        }
        git.push('origin', 'dev', { args: '--tags' }, cb);
    });
});

gulp.task('release_done', function(cb) {
    console.log('RELEASE FINISHED SUCCESSFULLY');
    cb();
});

gulp.task('release', gulp.series(
    'bump-version',
    'changelog',
    'commit-changes',
    'push-changes',
    'create-new-tag',
    'github-release',
    'release_done'));
