const gulp = require("gulp");
// sass圧縮プラグイン
const sass = require("gulp-sass")(require("sass"));
// ベンダープレフィックスプラグイン
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
// 画像圧縮プラグイン
const imagemin = require("gulp-imagemin");
const imageminGifsicle = require("imagemin-gifsicle");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");
//ファイルの更新の監視
const browserSync = require("browser-sync").create();
// 表示をわかりやすくする
const plumber = require("gulp-plumber");
const notify = require("gulp-notify");
//jsのコンパイル
const babel = require("gulp-babel");

// ファイルの出力場所の設定

const srcBase = "../_static/src"; //HTMLのコピー先
const distBase = "../_static/dest";

//ファイルの出力先 distディレクトリ
const distPath = {
  css: distBase + "/css/",
  html: distBase + "/",
  img: distBase + "/img/",
  js: distBase + "/js/",
};

//ファイル元 srcディレクトリ
const srcPath = {
  css: srcBase + "/css/**/*.scss",
  html: srcBase + "/**/*.html",
  img: srcBase + "/img/**/*",
  js: srcBase + "/js/*.js",
};

// htmlコピー
function htmlCopy() {
  return gulp
    .src(srcPath.html)
    .pipe(gulp.dest(distPath.html))
    .pipe(
      notify({
        message: "Copied HTML！",
        onLast: true,
      })
    );
}
//jsコピー

function jsBabel() {
  return gulp.src(srcPath.js).pipe(gulp.dest(distPath.js));
}
// sassコンパイル
function cssTranspile() {
  return gulp
    .src(srcPath.css)
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(sass())
    .pipe(postcss([autoprefixer()]))
    .pipe(gulp.dest(distPath.css))
    .pipe(
      notify({
        message: "Compiled Sass",
        onLast: true,
      })
    );
}

// 画像の圧縮
function imageCompress() {
  return gulp
    .src(srcPath.img)
    .pipe(
      imagemin(
        [
          imageminGifsicle({ optimizationLevel: 3 }),
          imageminMozjpeg({ quality: 80 }),
          imageminPngquant(),
          imageminSvgo({
            plugins: [
              {
                name: "removeViewBox",
                active: false,
              },
            ],
          }),
        ],
        { verbose: true }
      )
    )
    .pipe(gulp.dest(distPath.img))
    .pipe(
      notify({
        message: "Compressed Images",
        onLast: true,
      })
    );
}

// ブラウザのオートリロードを初期化する関数
function browserSyncInit() {
  browserSync.init({
    server: {
      baseDir: distBase,
    },
  });
}

// ブラウザのオートリロードを行う関数
function browserSyncReload(callback) {
  browserSync.reload();
  callback();
}

// ファイルの変更を監視、変更されたらブラウザのリロードする関数
function watchFiles() {
  gulp.watch(srcPath.html, gulp.series(htmlCopy, browserSyncReload));
  gulp.watch(srcPath.css, gulp.series(cssTranspile, browserSyncReload));
  gulp.watch(srcPath.img, gulp.series(imageCompress, browserSyncReload));
  gulp.watch(srcPath.js, gulp.series(jsBabel, browserSyncReload));
}

// defaltタスクでは一連の変換・圧縮を行った後に、変更監視タスクに入るようにする
exports.default = gulp.series(
  htmlCopy,
  jsBabel,
  cssTranspile,
  imageCompress,
  gulp.parallel(browserSyncInit, watchFiles)
);
