"use strict";
$(function () {
  /**
   *  ハンバーガーメニューの設定
   */
  $(".h-menu").click(function () {
    $(".h-menu__bar").toggleClass("click");
    $(".g-nav").toggleClass("active");
  });

  /**
   *  page-topの設定
   */
  let pageTop = $(".page-top");
  // 最初はpage-topは隠す
  pageTop.hide();

  // スクロール時のイベント設定
  $(window).scroll(function () {
    // スクロールしてtopから700pxを超えた場合
    if ($(this).scrollTop() > 700) {
      // page-topを表示させる
      pageTop.fadeIn();
    } else {
      // page-topを非表示にする
      pageTop.fadeOut();
    }
  });

  // クリック時のイベント
  pageTop.click(function () {
    // 0.5秒をかけてページトップに移動する
    $("body,html").animate({ scrollTop: 0 }, 500);

    // イベントが親要素へ影響しないように記述
    return false;
  });
});
