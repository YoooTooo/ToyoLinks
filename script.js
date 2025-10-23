document.addEventListener('DOMContentLoaded', () => {
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    // 画像情報に基づき、CSSのwidth/heightと一致させる
    const amaterasuWidth = 120;
    const amaterasuHeight = 180;

    const moveDuration = 400;
    const fadeDuration = 500;
    const INITIAL_TRANSFORM_X = -50;
    const INITIAL_BOTTOM_OFFSET = 20;

    // アマテラスにtransformを適用するコア関数
    function applyTransform(xOffset, yOffset) {
        // CSSの初期位置 (-50%) と、計算したピクセル値を結合
        const transformValue = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${xOffset}px)) translateY(${yOffset}px)`;

        console.log("Applying Transform:", transformValue); // ★デバッグ用: 適用値をコンソールに出力
        amaterasu.style.transform = transformValue;
    }

    // --- 画面全体のクリックイベント ---
    container.addEventListener('click', (e) => {
        if (!e.target.closest('.torii-link')) {
            const clickX = e.clientX;
            const clickY = e.clientY;

            const containerRect = container.getBoundingClientRect();

            // 1. X方向の移動量計算
            const relativeClickX = clickX - containerRect.left;
            const centerOffset = relativeClickX - (containerRect.width / 2); // X方向のピクセル移動量

            // 2. Y方向の移動量計算
            const bottomOfContainer = containerRect.top + containerRect.height;
            const distance_from_bottom = bottomOfContainer - clickY;
            const y_offset_from_bottom = distance_from_bottom - INITIAL_BOTTOM_OFFSET - (amaterasuHeight / 2);
            const transformY_px = -y_offset_from_bottom; // 上方向がマイナス

            console.log(`Click: (${clickX}, ${clickY}), OffsetX: ${centerOffset.toFixed(2)}, OffsetY: ${transformY_px.toFixed(2)}`); // ★デバッグ用

            // アマテラスを移動
            applyTransform(centerOffset, transformY_px);
        }
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.href;

            // X方向の移動量計算 (鳥居の中心へ)
            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const linkCenterOffset = (linkRect.left + linkRect.width / 2) - (containerRect.left + containerRect.width / 2);

            // リンククリック時は、Y方向の引数は0（CSSの bottom: 20px を維持）
            const y_pos_link_click = 0;

            // 1. 移動アニメーション実行
            applyTransform(linkCenterOffset, y_pos_link_click);

            // 2. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                // 消えるときも最後の位置を維持しつつ、上にフワッと移動
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