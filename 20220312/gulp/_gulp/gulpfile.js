// gulpコマンドの省略
const { src, dest, watch, lastRun, series, parallel } = require("gulp");
const gulp = { src, dest, watch, lastRun, series, parallel };
//コマンドgulp

// Sass
const sass = require("gulp-dart-sass");
const notify = require("gulp-notify");
const plumber = require("gulp-plumber");
const postCss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const gcmq = require("gulp-group-css-media-queries");
const cssnano = require("gulp-cssnano");
const rename = require("gulp-rename");

// JavaScript
const babel = require("gulp-babel");
const terser = require("gulp-terser"); //ES6(ES2015)の圧縮に対応

// 画像圧縮
const imageMin = require("gulp-imagemin");
const pngQuant = require("imagemin-pngquant");
const mozJpeg = require("imagemin-mozjpeg");
const svgo = require("gulp-svgo");
const webp = require("gulp-webp"); //webpに変換

// ブラウザ同期
const browserSync = require("browser-sync").create();

// 削除
const clean = require("gulp-clean");

//出力元フォルダ
const srcPath = "../_static/src";
//出力先フォルダ
const destPath = "../_static/dest";

//パス設定
const paths = {
  html: {
    src: srcPath + "/**/*.html",
    copy: srcPath + "/**/*.html",
    dist: destPath + "/",
    distCopy: destPath + "/",
  },
  styles: {
    src: srcPath + "/scss/**/*.scss",
    copy: srcPath + "/css/vendors/*.css",
    dist: destPath + "/assets/css/",
    distCopy: destPath + "/assets/css/vendors/",
  },
  scripts: {
    src: ["../_static/src/js/**/*.js", "!../_static/src/js/**/vendors/*.js"], //外部のライブラリファイルはコンパイルしない
    copy: srcPath + "/js/**/vendors/*.js",
    dist: destPath + "/assets/js/",
  },
  images: {
    src: srcPath + "/images/**/*.{jpg,jpeg,png,gif,svg}",
    srcWebp: srcPath + "/images/**/*.{jpg,jpeg,png}",
    dist: destPath + "/assets/images/",
    distWebp: destPath + "/assets/images/webp/",
  },
};

// htmlの作成
const htmCompile = () => {
  return src(paths.html.src)
    .pipe(
      plumber({
        // エラーがあっても処理を止めない
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(dest(paths.html.dist))
    .pipe(browserSync.stream());
};
// Sassコンパイル
const sassCompile = () => {
  return (
    src(paths.styles.src, {
      // ソースマップの出力の有無
      sourcemaps: true,
    })
      .pipe(
        plumber({
          // エラーがあっても処理を止めない
          errorHandler: notify.onError("Error: <%= error.message %>"),
        })
      )
      // scss→cssコンパイル
      .pipe(
        sass({
          //出力時の形式（下記詳細）
          /*
           *https://utano.jp/entry/2018/02/hello-sass-output-style/
           */
          outputStyle: "expanded",
        }).on("error", sass.logError)
      )
      .pipe(
        postCss([
          autoprefixer({
            //ベンダープレフィックス追加※設定はpackage.jsonに記述
            cascade: false, // プロパティのインデントを整形しない
            grid: "autoplace", // IE11のgrid対応
          }),
        ])
      )
      //メディアクエリをまとめる
      .pipe(gcmq())
      .pipe(
        dest(paths.styles.dist, {
          // ソースマップを出力する場合のパス
          sourcemaps: "./map",
        })
      )
      // cssのminファイル化
      .pipe(postCss(cssnano))
      .pipe(
        rename({
          suffix: ".min",
        })
      )
      .pipe(dest(paths.styles.dist))

      //変更があった所のみコンパイル
      .pipe(browserSync.stream())
  );
};

// JavaScriptコンパイル
const jsCompile = () => {
  return src(paths.scripts.src)
    .pipe(
      plumber({
        // エラーがあっても処理を止めない
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(
      babel({
        presets: ["@babel/preset-env"],
      })
    )
    .pipe(terser()) //圧縮
    .pipe(dest(paths.scripts.dist));
};

// 画像圧縮
const imagesCompress = () => {
  return src(paths.images.src, {
    since: lastRun(imagesCompress),
  })
    .pipe(
      plumber({
        // エラーがあっても処理を止めない
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(
      imageMin(
        [
          mozJpeg({
            quality: 80, //画質
          }),
          pngQuant(
            [0.6, 0.8] //画質の最小,最大
          ),
        ],
        {
          verbose: true, //メタ情報削除
        }
      )
    )
    .pipe(
      svgo({
        plugins: [
          {
            removeViewbox: false, //フォトショやイラレで書きだされるviewboxを消すかどうか※表示崩れの原因になるのでfalse推奨。以降はお好みで。
          },
          {
            removeMetadata: false, //<metadata>を削除するかどうか
          },
          {
            convertColors: false, //rgbをhexに変換、または#ffffffを#fffに変換するかどうか
          },
          {
            removeUnknownsAndDefaults: false, //不明なコンテンツや属性を削除するかどうか
          },
          {
            convertShapeToPath: false, //コードが短くなる場合だけ<path>に変換するかどうか
          },
          {
            collapseGroups: false, //重複や不要な`<g>`タグを削除するかどうか
          },
          {
            cleanupIDs: false, //SVG内に<style>や<script>がなければidを削除するかどうか
          },
          // {
          //   mergePaths: false,//複数のPathを一つに統合
          // },
        ],
      })
    )
    .pipe(dest(paths.images.dist));
};

// webp変換
// ※案件によってはIE対応が必要なので、混在しないように別フォルダに出力しています。
const webpConvert = () => {
  return src(paths.images.srcWebp, {
    since: lastRun(webpConvert),
  })
    .pipe(
      plumber({
        // エラーがあっても処理を止めない
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(webp())
    .pipe(dest(paths.images.distWebp));
};

// HTMLファイルコピー（vendorsフォルダの中身はコンパイルしない
const htmlCopy = () => {
  return src(paths.html.copy).pipe(dest(paths.html.distCopy));
};
// CSSファイルコピー（vendorsフォルダの中身はコンパイルしない
const cssCopy = () => {
  return src(paths.styles.copy).pipe(dest(paths.styles.distCopy));
};

// JSファイルコピー（vendorsフォルダの中身はコンパイルしない
const jsCopy = () => {
  return src(paths.scripts.copy).pipe(dest(paths.scripts.dist));
};

// ローカルサーバー起動
const browserSyncFunc = (done) => {
  browserSync.init({
    //デフォルトの connected のメッセージ非表示
    port: 8888, //ポート番号の変更
    notify: false,
    server: {
      baseDir: "../",
    },
    startPath: "../_static/dest/index.html",
    reloadOnRestart: true,
  });
  done();
};

// ブラウザ自動リロード
const browserReloadFunc = (done) => {
  browserSync.reload();
  done();
};

// ファイル監視
const watchFiles = () => {
  watch(paths.html.src, series(htmCompile));
  watch(paths.html.copy, series(htmlCopy));
  watch(paths.styles.src, series(sassCompile));
  watch(paths.styles.copy, series(cssCopy));
  watch(paths.scripts.src, series(jsCompile, browserReloadFunc));
  watch(paths.scripts.copy, series(jsCopy, browserReloadFunc));
  watch(
    paths.images.src,
    series(imagesCompress, webpConvert, browserReloadFunc)
  );
};

// npx gulp のコマンドで実行される処理
exports.default = series(
  parallel(
    htmlCopy,
    sassCompile,
    cssCopy,
    jsCompile,
    jsCopy,
    imagesCompress,
    webpConvert
  ),
  parallel(watchFiles, browserSyncFunc)
);
