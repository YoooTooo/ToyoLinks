// =========================================================
// script.js: メイン制御と定数定義
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. DOM要素の定義 (window スコープで宣言し、他のファイルからアクセス可能にする)
    window.amaterasu = document.getElementById('amaterasu-char');
    window.container = document.querySelector('.portal-container');
    window.links = document.querySelectorAll('.torii-link');
    window.omikujiArea = document.querySelector('.omikuji-area');
    window.omikujiBox = document.getElementById('omikuji-box');
    window.omikujiResultDiv = document.getElementById('omikuji-result');
    window.omikujiPaper = document.querySelector('.omikuji-paper');
    window.omikujiMessage = document.getElementById('omikuji-message');
    window.omikujiResetMessage = document.getElementById('omikuji-reset-message');

    // 2. 定数・設定の定義 (他のファイルでも使用)
    window.amaterasuWidth = 120;
    window.amaterasuHeight = 180;
    window.moveDuration = 400;
    window.fadeDuration = 500;
    window.INITIAL_BOTTOM_OFFSET = 20;
    window.HOVER_LOAD_TIME = 1000;

    // 3. アマテラスの初期配置 (interactive-elements.js の関数を呼び出す)
    // restoreOmikujiStateAndPosition, applyTransform は他のファイルで定義されます
    if (checkOmikujiStatus()) {
        restoreOmikujiStateAndPosition();
    } else {
        const initialPositionX = (container.clientWidth / 2) - (amaterasuWidth / 2);
        applyTransform(initialPositionX, 0);
    }

    // 4. イベントリスナーの初期化 (他のファイルで定義された関数を呼び出す)
    setupAmaterasuMovement(); // amaterasu-movement.js の関数
    setupInteractiveElements(); // interactive-elements.js の関数
});