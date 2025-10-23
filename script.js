document.addEventListener('DOMContentLoaded', () => {
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    const amaterasuWidth = 120;

    const moveDuration = 400; // 移動アニメーションの時間 (ms)
    const fadeDuration = 500; // 消えて遷移するまでの待機時間 (ms)

    // 初期位置の基準値 (-50%)
    const INITIAL_TRANSFORM_X = -50;

    // --- アマテラスを移動させるコア関数 ---
    // targetTranslateX は、CSSの INITIAL_TRANSFORM_X (-50%) に追加するピクセル値
    function moveAmaterasu(targetPixelOffset) {
        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;

        // CSSの初期位置 (translateX(-50%)) に、計算したピクセル値を加算
        amaterasu.style.transform = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${targetPixelOffset}px))`;
    }

    // --- 画面全体のクリックイベント ---
    container.addEventListener('click', (e) => {
        // クリックした要素がリンク（<a>）またはその子要素でないかチェック
        if (!e.target.closest('.torii-link')) {
            const clickX = e.clientX;
            const containerRect = container.getBoundingClientRect();

            // 1. コンテナの左端からクリック位置までのピクセル距離
            const relativeClickX = clickX - containerRect.left;

            // 2. コンテナの中心 (left: 50%) からクリック位置までのピクセル差
            // この差分が、初期位置からの移動量となる
            const centerOffset = relativeClickX - (containerRect.width / 2);

            // 3. アマテラスの左端ではなく、中心がクリック位置に来るように調整
            // translateX(-50%)で中心が揃っているので、centerOffsetをそのまま移動量とする
            moveAmaterasu(centerOffset);
        }
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetUrl = link.href;

            // 1. リンク（鳥居）の中心へ移動させるための位置計算
            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // コンテナの中心から鳥居の中心までのピクセル差 (移動量)
            const linkCenterOffset = (linkRect.left + linkRect.width / 2) - (containerRect.left + containerRect.width / 2);

            // 2. 移動アニメーション実行
            moveAmaterasu(linkCenterOffset);

            // 3. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                // リンクの中心で消えるように調整
                amaterasu.style.transform = `translateX(calc(${INITIAL_TRANSFORM_X}%) translateX(${linkCenterOffset}px)) translateY(-30px)`;

                // 4. 完全に消えた後にページを遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });
});