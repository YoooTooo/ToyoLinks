document.addEventListener('DOMContentLoaded', () => {
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    // CSSで設定したアマテラスの幅
    const amaterasuWidth = 120; // ★CSSの .amaterasu { width: 120px; } と一致

    // アニメーション時間の設定
    const moveDuration = 400; // 移動アニメーションの時間 (ms)
    const fadeDuration = 500; // 消えて遷移するまでの待機時間 (ms)

    // --- アマテラスを移動させるコア関数 ---
    function moveAmaterasu(targetX) {
        // 1. 移動アニメーション（駆け寄る）
        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
        amaterasu.style.transform = `translateX(${targetX}px)`;
    }

    // --- 画面全体のクリックイベント ---
    // リンクエリア以外をクリックした場合、アマテラスを移動させる
    container.addEventListener('click', (e) => {
        // クリックした要素がリンク（<a>）またはその子要素でないかチェック
        if (!e.target.closest('.torii-link')) {
            // クリック位置のX座標を取得
            const clickX = e.clientX;

            // コンテナの左端からの相対位置を計算
            const containerRect = container.getBoundingClientRect();
            const relativeClickX = clickX - containerRect.left;

            // アマテラスの中心がクリック位置に来るように、移動量(transformX)を計算
            // アマテラスは初期状態でコンテナの中央に配置されているため、その基準からの移動量を求める
            const containerCenterRelX = containerRect.width / 2;
            const targetTransformX = relativeClickX - containerCenterRelX - (amaterasuWidth / 2);

            moveAmaterasu(targetTransformX);
        }
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetUrl = link.href;

            // 1. リンク（鳥居）の中央へ移動させるための位置計算
            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const linkCenterRelX = (linkRect.left + linkRect.width / 2) - containerRect.left;
            const containerCenterRelX = containerRect.width / 2;
            const moveDistanceX = linkCenterRelX - containerCenterRelX;
            const finalTransformX = moveDistanceX - amaterasuWidth / 2; // 鳥居の前に立つ位置に微調整

            // 2. 移動アニメーション実行
            moveAmaterasu(finalTransformX);

            // 3. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';
                amaterasu.style.transform = `translateX(${finalTransformX}px) translateY(-30px)`; // 上へ消える

                // 4. 完全に消えた後にページを遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });
});