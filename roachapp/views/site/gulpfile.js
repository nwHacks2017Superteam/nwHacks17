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
const pkg = require('../../package.json');

// Create an array with the current month, day and time
const now = new Date();
const date = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;

const banner = `/*
 Theme Name:   <%= pkg.name %>
 Theme URI:    <%= pkg.repository %>
 Description:  <%= pkg.name %> Theme
 Author:       <%= pkg.author.name %>
 Author URI:   <%= pkg.author.url %>
 Version:      <%= pkg.version %>
 License:      <%= pkg.license.type %>
 License URI:  <%= pkg.license.url %>
 Tags:         <%= pkg.keywords %>
 Text Domain:  <%= pkg.slug %>
 Template:     peterbilt-theme
*/
`;

gulp.task('js', function() {
    gulp.src('scripts/*.js')
        .pipe(concat('script.js'))
        .pipe(gulp.dest('scripts/'));
});

gulp.task('cssmin', function() {
    gulp.src('styles/style.css')
        .pipe(cssmin())
        .pipe(concat('style.min.css'))
        .pipe(gulp.dest('styles/'));
});

gulp.task('sass', function() {
    gulp.src('styles/*.scss')
        .pipe(sass())
        .pipe(concat('style.css'))
        .pipe(gulp.dest('styles/'));
});


gulp.task('uglify', function() {
    gulp.src('scripts/script.js')
        .pipe(uglify())
        .pipe(concat('script.min.js'))
        .pipe(header(banner, {
            pkg: pkg,
            date: date
        }))
        .pipe(gulp.dest('scripts/'));
});

gulp.task('watch', function() {
    gulp.watch('styles/*.scss', ['sass']);
    gulp.watch('scripts/*.js', ['js']);
});

gulp.task('default', ['sass', 'js'], function() {
    // fired before 'finished' event
});

gulp.task('build', ['sass', 'cssmin', 'js', 'uglify'], function() {
    // fired before 'finished' event
});
