document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.torii-link');
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');

    // CSSで設定したアマテラスの幅
    const amaterasuWidth = 120; // ★CSSの .amaterasu { width: 120px; } と一致

    // アニメーション時間の設定
    const moveDuration = 400; // アマテラスが移動する時間 (ms)
    const fadeDuration = 500; // 消えて遷移するまでの待機時間 (ms)

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const targetUrl = link.href;

            // --- 位置計算 ---
            const linkRect = link.getBoundingClientRect(); // クリックされた鳥居の位置
            const containerRect = container.getBoundingClientRect(); // コンテナの位置

            // 1. リンクの中心のX座標（コンテナの左端からの相対位置）
            const linkCenterRelX = (linkRect.left + linkRect.width / 2) - containerRect.left;

            // 2. コンテナの中心のX座標（コンテナの左端からの相対位置）
            const containerCenterRelX = containerRect.width / 2;

            // 3. アマテラスを移動させるべき距離 (リンクの中心 - コンテナの中心)
            // アマテラスは初期状態でコンテナの中心にいるため、この差分が移動量
            const moveDistanceX = linkCenterRelX - containerCenterRelX;

            // 4. アマテラスの「駆け寄り」アニメーションを実行する関数
            function animateAmaterasu(moveX) {
                // 4-1. 移動アニメーション（駆け寄る）
                amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
                amaterasu.style.transform = `translateX(${moveX}px)`;

                // 4-2. 移動完了後に消えるアニメーション（神隠し）
                setTimeout(() => {
                    amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                    amaterasu.style.opacity = '0';
                    // 移動後の位置から少し上へ消えるように調整
                    amaterasu.style.transform = `translateX(${moveX}px) translateY(-30px)`;

                    // 4-3. 完全に消えた後にページを遷移
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, fadeDuration);

                }, moveDuration);
            }

            // --- アニメーション実行 ---
            animateAmaterasu(moveDistanceX);
        });
    });
});