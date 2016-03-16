//initialize all of our variables
var app, base, concat, directory, gulp, gutil, hostname, path, refresh, rev, revReplace,
    sass, uglify, imagemin, minifyCSS, del, browserSync, autoprefixer, gulpif,
    gulpSequence, shell, sourceMaps, plumber, nunjucksRender, gData, _, path, merge, fs;

var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

//load all of our dependencies
//add more here if you want to include more libraries
gulp        = require('gulp');
gutil       = require('gulp-util');
concat      = require('gulp-concat');
uglify      = require('gulp-uglify');
sass        = require('gulp-sass');
sourceMaps  = require('gulp-sourcemaps');
imagemin    = require('gulp-imagemin');
minifyCSS   = require('gulp-minify-css');
browserSync = require('browser-sync');
autoprefixer = require('gulp-autoprefixer');
gulpSequence = require('gulp-sequence').use(gulp);
shell       = require('gulp-shell');
plumber     = require('gulp-plumber');
nunjucksRender = require('gulp-nunjucks-render');
gData       = require('gulp-data');
_           = require('lodash');
path        = require('path');
merge       = require('merge-stream');
fs          = require('fs');
gulpif      = require('gulp-if');
rev = require("gulp-rev");
revReplace = require("gulp-rev-replace");
ghPages = require('gulp-gh-pages');


var _gulpStart = gulp.Gulp.prototype.start;

var _runTask = gulp.Gulp.prototype._runTask;

gulp.Gulp.prototype.start = function (taskName) {
  this.currentStartTaskName = taskName;

  _gulpStart.apply(this, arguments);
};

gulp.Gulp.prototype._runTask = function (task) {
  this.currentRunTaskName = task.name;

  _runTask.apply(this, arguments);
};


gulp.task('browserSync', function() {
    browserSync({
        server: {
            baseDir: ['app/']
        },
        options: {
            reloadDelay: 250
        },
        port: 9000,
        notify: false
    });
});


//compressing images & handle SVG files
gulp.task('images', function(tmp) {
    gulp.src(['app/images/*.jpg', 'app/images/*.png'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(imagemin({ optimizationLevel: 5, progressive: true, interlaced: true }))
        .pipe(gulp.dest('app/images'));
});

//compressing images & handle SVG files
gulp.task('images-deploy', function() {
    gulp.src(['app/images/**/*', '!app/images/README'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('dist/images'));
});


function processScripts(sendReload, destPath, doCompression) {
  var byPagesPath = 'app/scripts/src/by_page';

  function getFolders(dir) {
    return fs.readdirSync(dir)
      .filter(function(file) {
        return fs.statSync(path.join(dir, file)).isDirectory();
      });
  }

  //this is where our dev JS scripts are



  var tasks = getFolders(byPagesPath).map(function(folder) {
    return gulp.src([path.join(byPagesPath, '_includes/**/*.js'), path.join(byPagesPath, folder, '**/*.js')])
      //prevent pipe breaking caused by errors from gulp plugins
      .pipe(plumber())
      //this is the filename of the compressed version of our JS
      .pipe(concat(folder + '.js'))
      //catch errors
      //compress :D
      .pipe(gulpif(doCompression, sourceMaps.init()))
      .pipe(gulpif(doCompression, uglify()))
      .pipe(gulpif(doCompression, sourceMaps.write('.')))
      //where we will store our finalized, compressed script
      .pipe(gulp.dest(destPath))
      //notify browserSync to refresh
      .pipe(gulpif(sendReload, browserSync.reload({stream: true})));
  });

  var root = gulp.src([
    'app/scripts/src/_includes/jquery.*.js',
    'app/scripts/src/_includes/inview.min.js',
    'app/scripts/src/_includes/*.js',
    'app/scripts/src/_includes/**/*.js',
    'app/scripts/src/*.js'
  ])
    //prevent pipe breaking caused by errors from gulp plugins
    .pipe(plumber())
    //this is the filename of the compressed version of our JS
    .pipe(concat('app.js'))
    //catch errors
    .on('error', gutil.log)
    //compress :D
    .pipe(gulpif(doCompression, sourceMaps.init()))
    .pipe(gulpif(doCompression, uglify()))
    .pipe(gulpif(doCompression, sourceMaps.write('.')))
    //where we will store our finalized, compressed script
    .pipe(gulp.dest(destPath))
    //notify browserSync to refresh
    .pipe(gulpif(sendReload, browserSync.reload({stream: true})));

  return merge(tasks, root);
};

//compiling our Javascripts
gulp.task('scripts', function() {
  return processScripts(true ,'app/scripts', false);
});

//compiling our Javascripts for deployment
gulp.task('scripts-deploy', function() {
    //this is where our dev JS scripts are
  return processScripts(false, 'dist/scripts', true);
});

//compiling our SCSS files
gulp.task('styles', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/styles/main.scss')
                //prevent pipe breaking caused by errors from gulp plugins
                .pipe(plumber(function (error) {
                  gutil.log(error);
                  this.emit('end');
                }))
                //get sourceMaps ready
                .pipe(sourceMaps.init())
                //include SCSS and list every "include" folder
                .pipe(sass({
                      errLogToConsole: true,
                      includePaths: [
                          'app/styles/'
                      ]
                }))
                .pipe(autoprefixer({
                   browsers: autoPrefixBrowserList,
                   cascade:  true
                }))
                //catch errors
                .on('error', gutil.log)
                //the final filename of our combined css file
                .pipe(concat('styles.css'))
                //get our sources via sourceMaps
                .pipe(sourceMaps.write())
                //where to save our final, compressed css file
                .pipe(gulp.dest('app/styles'))
                //notify browserSync to refresh
                .pipe(browserSync.reload({stream: true}));
});

//compiling our SCSS files for deployment
gulp.task('styles-deploy', function() {
    //the initializer / master SCSS file, which will just be a file that imports everything
    return gulp.src('app/styles/main.scss')
                .pipe(plumber())
                //include SCSS includes folder
                .pipe(sass({
                      includePaths: [
                          'app/styles/',
                      ]
                }))
                .pipe(autoprefixer({
                  browsers: autoPrefixBrowserList,
                  cascade:  true
                }))
                //the final filename of our combined css file
                .pipe(concat('styles.css'))
                .pipe(minifyCSS())
                //where to save our final, compressed css file
                .pipe(gulp.dest('dist/styles'));
});


//basically just keeping an eye on all HTML files
gulp.task('html', function() {
  //watch any and all HTML files and refresh when something changes

  var _this = this;

  var nunjucks = nunjucksRender.nunjucks.configure(['app/templates/'], {
    tags: {
      blockStart: '<%',
      blockEnd: '%>',
      variableStart: '<$',
      variableEnd: '$>',
      commentStart: '<#',
      commentEnd: '#>'
    },
    watch: false
  });

  return gulp.src('app/pages/*.+(html|nunjucks)')
    .pipe(plumber())
    .pipe(gData(function(file) {
        var filename = path.resolve('./app/pages/data.js');
        delete require.cache[filename];
        return require('./app/pages/data.js')(file.relative.split('.')[0]);
    }))
    .on('error', gutil.log)
    .pipe(nunjucksRender())
    .on('error', gutil.log)
    .pipe(gulp.dest('app/'));
});

gulp.task('html-watcher', ['html'], function() {
  return gulp.src('app/*.html')
    .pipe(plumber())
    .pipe(browserSync.reload({stream: true}))
    .on('error', gutil.log);
});

//migrating over all HTML files for deployment
gulp.task('html-deploy', ['html'], function() {
    //grab everything, which should include htaccess, robots, etc
    gulp.src(['app/*', '!app/pages', '!app/components', '!app/templates'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('dist'));

    //grab any hidden files too
    gulp.src('app/.*')
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('dist'));

    gulp.src(['app/fonts/**/*', '!app/fonts/README'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('dist/fonts'));

    //grab all of the styles
    gulp.src(['app/styles/*.css', '!app/styles/styles.css'])
        //prevent pipe breaking caused by errors from gulp plugins
        .pipe(plumber())
        .pipe(gulp.dest('dist/styles'));
});

gulp.task('rev', function() {
  return gulp.src(['dist/styles/styles.css', 'dist/scripts/app.js', 'dist/scripts/pricing.js'], {base: 'dist'})
    .pipe(sourceMaps.init({loadMaps: true}))
    .pipe(rev())
    .pipe(sourceMaps.write('.'))
    .pipe(gulp.dest('dist/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('dist/'))
});

gulp.task('revreplace', ['rev'], function(){
  var manifest = gulp.src("./dist/rev-manifest.json");

  return gulp.src('dist/*.html')
    .pipe(revReplace({manifest: manifest}))
    .pipe(gulp.dest('dist/'));
});

gulp.task('gh-pages', function() {
  return gulp.src('./dist/**/**/*')
      .pipe(ghPages());
});

//cleans our dist directory in case things got deleted
gulp.task('clean', function() {
    return shell.task('rm -rf dist');
});

//create folders using shell
gulp.task('scaffold', function() {
  return shell.task([
      'mkdir dist',
      'mkdir dist/fonts',
      'mkdir dist/images',
      'mkdir dist/scripts',
      'mkdir dist/styles'
    ]
  );
});

//this is our master task when you run `gulp` in CLI / Terminal
//this is the main watcher to use when in active development
//  this will:
//  startup the web server,
//  start up browserSync
//  compress all scripts and SCSS files
gulp.task('default', ['browserSync', 'scripts', 'styles', 'html'], function() {
    //a list of watchers, so it will watch all of the following files waiting for changes
    gulp.watch('app/scripts/src/**', ['scripts']);
    gulp.watch(['app/styles/**/*.scss', 'app/styles/**/**/*.scss', 'app/styles/**/**/**/*.scss'], ['styles']);
    gulp.watch('app/images/**', ['images']);
    gulp.watch(['app/pages/*.nunjucks', 'app/templates/**/*.nunjucks'], ['html', 'html-watcher']);
    gulp.watch('app/pages/data.js', ['html', 'html-watcher']);
});

//this is our deployment task, it will set everything for deployment-ready files
gulp.task('deploy', gulpSequence('clean', 'scaffold', ['scripts-deploy', 'styles-deploy', 'images-deploy'], 'html-deploy', 'rev', 'revreplace'));
