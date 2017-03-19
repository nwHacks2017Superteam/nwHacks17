const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const sourcemaps = require('gulp-sourcemaps');
const browserify = require('gulp-browserify');
const buble = require('gulp-buble');
const cssmin = require('gulp-cssmin');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const header = require('gulp-header');

// Create an array with the current month, day and time
const now = new Date();
const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

gulp.task('js', function() {
    gulp.src('public/scripts/*.js')
        .pipe(concat('script.js'))
        .pipe(gulp.dest('public/scripts/'));
});

gulp.task('cssmin', function() {
    gulp.src('public/styles/style.css')
        .pipe(cssmin())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('public/styles/'));
});

gulp.task('sass', function() {
    gulp.src('public/styles/*.scss')
        .pipe(sass())
        .pipe(concat('style.css'))
        .pipe(gulp.dest('public/styles/'));
});


gulp.task('uglify', function() {
    gulp.src('public/scripts/script.js')
        .pipe(uglify())
        .pipe(concat('script.min.js'))
        .pipe(gulp.dest('public/scripts/'));
});

gulp.task('watch', function() {
    gulp.watch('public/styles/*.scss', ['sass']);
    gulp.watch('public/scripts/*.js', ['js']);
});

gulp.task('default', ['sass', 'js'], function() {
    // fired before 'finished' event
});

gulp.task('build', ['sass', 'cssmin', 'js', 'uglify'], function() {
    // fired before 'finished' event
});
