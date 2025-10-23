// 【重要】この行は、スクリプトが読み込まれるかテストするためのものです。
console.log("Script loading attempt: Ready to run logic.");

document.addEventListener('DOMContentLoaded', () => {
    // 【重要】DOM構築後にスクリプトが実行されたかテスト
    console.log("Script executed: DOMContentLoaded.");

    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    // SVGファイルに基づき、CSSと一致させる
    const amaterasuWidth = 120;
    const amaterasuHeight = 180; // (120 * 1.5)

    const moveDuration = 400;
    const fadeDuration = 500;
    const INITIAL_TRANSFORM_X = -50;
    const INITIAL_BOTTOM_OFFSET = 20;

    // アマテラスにtransformを適用するコア関数
    function applyTransform(xOffset, yOffset) {
        // CSSの初期位置 (-50%) と、計算したピクセル値を結合
        const transformValue = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${xOffset}px)) translateY(${yOffset}px)`;

        // デバッグ用: 適用されるtransform値を出力
        console.log(`Applying Transform: X=${xOffset.toFixed(2)}px, Y=${yOffset.toFixed(2)}px`);

        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
        amaterasu.style.transform = transformValue;
    }

    // --- 画面全体のクリックイベント ---
    container.addEventListener('click', (e) => {
        if (!e.target.closest('.torii-link')) {
            const clickX = e.clientX;
            const clickY = e.clientY;

            const containerRect = container.getBoundingClientRect();

            // X方向の移動量計算 
            const relativeClickX = clickX - containerRect.left;
            const centerOffset = relativeClickX - (containerRect.width / 2);

            // Y方向の移動量計算
            const bottomOfContainer = containerRect.top + containerRect.height;
            const distance_from_bottom = bottomOfContainer - clickY;
            const y_offset_from_bottom = distance_from_bottom - INITIAL_BOTTOM_OFFSET - (amaterasuHeight / 2);
            const transformY_px = -y_offset_from_bottom;

            // アマテラスを移動
            applyTransform(centerOffset, transformY_px);
        }
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.href;

            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const linkCenterOffset = (linkRect.left + linkRect.width / 2) - (containerRect.left + containerRect.width / 2);

            const y_pos_link_click = 0;

            // 1. 移動アニメーション実行
            applyTransform(linkCenterOffset, y_pos_link_click);

            // 2. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                const final_fade_transform = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${linkCenterOffset}px)) translateY(-30px)`;
                amaterasu.style.transform = final_fade_transform;

                // 3. 完全に消えた後にページを遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });
});