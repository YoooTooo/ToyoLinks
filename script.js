document.addEventListener('DOMContentLoaded', () => {
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    const amaterasuWidth = 120;
    const amaterasuHeight = 120; // ★SVGの高さに合わせて調整してください（例として120px）

    const moveDuration = 400; // 移動アニメーションの時間 (ms)
    const fadeDuration = 500; // 消えて遷移するまでの待機時間 (ms)

    // 初期位置の基準値
    const INITIAL_TRANSFORM_X = -50;
    // ★CSSの bottom: 20px からの移動を計算するため、初期のY位置（下からのオフセット）を把握しておく
    const INITIAL_BOTTOM_OFFSET = 20;

    // --- アマテラスを移動させるコア関数 ---
    // targetPixelOffset は X方向のピクセル移動量
    // targetY は、クリック位置のY座標（ページ上端から）
    function moveAmaterasu(targetPixelOffset, targetY = null) {
        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;

        let transformY_px = 0; // Y方向のピクセル移動量

        if (targetY !== null) {
            // Y方向の移動量を計算
            const containerRect = container.getBoundingClientRect();

            // 1. コンテナの底辺からクリック位置までの距離 (Y軸は下向きが正)
            const bottomOfContainer = containerRect.top + containerRect.height;
            const distance_from_bottom = bottomOfContainer - targetY;

            // 2. アマテラスの初期位置のY座標を考慮 (bottom: 20px)
            // アマテラスの中心がクリック位置に来るように計算
            const y_offset_from_bottom = distance_from_bottom - INITIAL_BOTTOM_OFFSET - (amaterasuHeight / 2);

            // Y軸はCSSのtransformでは「上方向がマイナス」なので、この値を使います
            transformY_px = -y_offset_from_bottom;
        } else {
            // リンククリック時は、現在のY位置を維持
            // X方向のみの移動。ここでは便宜上0として、CSSの bottom: 20px を維持する
            transformY_px = 0;
        }

        // CSSの初期位置 (translateX(-50%)) に、計算したピクセル値を加算
        amaterasu.style.transform = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${targetPixelOffset}px)) translateY(${transformY_px}px)`;
    }

    // --- 画面全体のクリックイベント ---
    container.addEventListener('click', (e) => {
        // e.target.closest() がリンク要素を返さない場合に実行
        if (!e.target.closest('.torii-link')) {
            const clickX = e.clientX;
            const clickY = e.clientY; // ★Y座標を取得！

            const containerRect = container.getBoundingClientRect();

            // X方向の移動量計算 (前回動作した計算)
            const relativeClickX = clickX - containerRect.left;
            const centerOffset = relativeClickX - (containerRect.width / 2);

            // アマテラスを移動
            moveAmaterasu(centerOffset, clickY); // ★Y座標を渡す
        }
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.href;

            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // X方向の移動量計算 (前回動作した計算)
            const linkCenterOffset = (linkRect.left + linkRect.width / 2) - (containerRect.left + containerRect.width / 2);

            // 1. 移動アニメーション実行
            // リンククリック時は、Y方向の引数（targetY）を null のままにして、
            // CSSの bottom: 20px の初期Y位置を維持
            moveAmaterasu(linkCenterOffset, null);

            // 2. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                // 消えるときも最後の位置を維持しつつ、上にフワッと移動
                amaterasu.style.transform = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${linkCenterOffset}px)) translateY(-30px)`;

                // 3. 完全に消えた後にページを遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });
});