var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var jsdoc = require('gulp-jsdoc3');

gulp.task('default', function() {
  return gulp.src('src/**/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel())
    .pipe(concat('all.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('build'));
});

gulp.task('doc', function(cb) {
  var config = require('./jsdoc.json');
  gulp.src(['README.md', './src/**/*.js'], {read: false})
    .pipe(jsdoc(config, cb));
});
