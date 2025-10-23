document.addEventListener('DOMContentLoaded', () => {
    console.log("Script loading attempt: Ready to run logic.");
    console.log("Script executed: DOMContentLoaded.");

    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    // CSSと一致させる定数
    const amaterasuWidth = 120;
    const amaterasuHeight = 180; // 計算用として維持

    // アニメーション時間
    const moveDuration = 400;
    const fadeDuration = 500;

    // CSSの初期位置の基準値（bottom: 20px は維持）
    const INITIAL_BOTTOM_OFFSET = 20;

    // アマテラスにtransformを適用するコア関数
    function applyTransform(xOffset, yOffset) {
        // ★修正: CSSの translateX(-50%) が無くなったため、
        // 左端 (left: 0) からの絶対ピクセル値として transform を適用
        const transformValue = `translateX(${xOffset}px) translateY(${yOffset}px)`;

        console.log(`Applying Transform: X=${xOffset.toFixed(2)}px, Y=${yOffset.toFixed(2)}px`);

        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
        amaterasu.style.transform = transformValue;
    }

    // --- 画面全体のクリックイベント ---
    container.addEventListener('click', (e) => {
        if (!e.target.closest('.torii-link')) {
            const clickX = e.clientX; // ページ左端からのクリックX座標
            const clickY = e.clientY; // ページ上端からのクリックY座標

            const containerRect = container.getBoundingClientRect();

            // 1. X方向の移動量計算
            // left: 0 からの移動量 ＝ (クリックX - コンテナ左端) - (アマテラスの幅 / 2)
            const relativeClickX = clickX - containerRect.left;
            const absoluteX_px = relativeClickX - (amaterasuWidth / 2); // アマテラスの中心をクリック位置に合わせる

            // 2. Y方向の移動量計算（足元合わせロジックはそのまま）
            const bottomOfContainer = containerRect.top + containerRect.height;
            const distance_from_bottom = bottomOfContainer - clickY;
            const y_offset_from_bottom = distance_from_bottom - INITIAL_BOTTOM_OFFSET;
            const transformY_px = -y_offset_from_bottom; // 上方向がマイナス

            // アマテラスを移動
            applyTransform(absoluteX_px, transformY_px); // ★絶対X位置を適用
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

            // ★修正: left: 0 からの絶対ピクセル位置を計算
            const linkCenterX = (linkRect.left + linkRect.width / 2) - containerRect.left;
            const absoluteLinkX_px = linkCenterX - (amaterasuWidth / 2); // 鳥居の中心にアマテラスの中心を合わせる

            // リンククリック時は、Y方向の引数は0（CSSの bottom: 20px の初期Y位置を維持）
            const y_pos_link_click = 0;

            // 1. 移動アニメーション実行
            applyTransform(absoluteLinkX_px, y_pos_link_click);

            // 2. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                // 消えるときも最後の位置を維持しつつ、上にフワッと移動
                const final_fade_transform = `translateX(${absoluteLinkX_px}px) translateY(-30px)`;
                amaterasu.style.transform = final_fade_transform;

                // 3. 完全に消えた後にページを遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });

    // ★ページロード時の初期位置設定（左中央から中央下へ移動）
    // スクリプトロード後、一度だけ初期位置を設定してアマテラスを画面中央下に配置
    const initialPositionX = (container.clientWidth / 2) - (amaterasuWidth / 2);
    applyTransform(initialPositionX, 0); // Y=0 は bottom: 20px の初期位置を意味する
});