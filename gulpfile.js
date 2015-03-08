var gulp = require('gulp');
var $ = require("gulp-load-plugins")({lazy:false, pattern: ['gulp-*', 'gulp.*', 'del*', 'handlebars*', 'front*', 'marked*']});
var pkg = require('./package.json');
var Path = require('path');
var fs = require('fs');
var es = require('event-stream');

var paths = {
    templates: './src/templates',
    partials: './src/templates/partials',
    less: './src/content/less',
    assets: './src/assets',
    javascript: './src/content/js',
    pages: './src/content/pages',
    posts: './src/content/posts',
    build: './build',
    content: './src/content'
};

gulp.task('partials', [], function() {
  return gulp.src(Path.join(paths.partials, '**.hbs'))
    .pipe($.tap(function(file) {
      var template = file.contents.toString();
      var templateName = Path.basename(file.path).replace(".hbs", "");
      $.handlebars.registerPartial(templateName, template);
    }))
});

gulp.task('pages', ['partials'], function() {
    return gulp.src(Path.join(paths.pages, '**.md'))
        .pipe($.data(function(file){
            var content = $.frontMatter(String(file.contents));
            file.contents = new Buffer($.marked(content.body));
            return content.attributes;
        }))
        .pipe(es.map(function(file, cb) {
            var templateName = file.data.template || 'default.hbs';
            var templateData = String(fs.readFileSync(Path.join(paths.templates, templateName)));
            var template = $.handlebars.compile(templateData);
            var html = template({body: String(file.contents)}, {});
            file.contents = new Buffer(html, "utf-8");
            cb(null, file);
        }))
        .pipe($.rename({extname: ".html"}))
        .pipe(gulp.dest(paths.build));
});

gulp.task('less', [], function () {
    gulp.src(Path.join(paths.less, 'application.less') )
    .pipe($.less({
      paths: [  ]
    }))
    .pipe(gulp.dest(Path.join(paths.build, 'styles')));
});

gulp.task('clean', function() {
    console.log("Clean all files in the build folder");
    $.del( Path.join( paths.build, '**'), function (err, deletedFiles) {
        console.log('Files deleted:',  deletedFiles.join(', '));
    });
});

gulp.task('build', ['less',  'pages'
                    ]);

gulp.task('default', ['build']);