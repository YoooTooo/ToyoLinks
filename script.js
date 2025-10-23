document.addEventListener('DOMContentLoaded', () => {
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');

    const amaterasuWidth = 120;
    const moveDuration = 400;
    const fadeDuration = 500;

    // CSSの left: 50% からのオフセットピクセルを追跡する変数
    let currentOffset = 0;

    // --- アマテラスを移動させるコア関数 ---
    function moveAmaterasu(targetPixelOffset) {
        currentOffset = targetPixelOffset; // 新しいオフセットを保存
        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;

        // CSSの初期位置 (-50%) を含めて、トータルの移動量を設定
        amaterasu.style.transform = `translateX(-50%) translateX(${currentOffset}px)`;
    }

    // --- 画面全体のクリックイベント ---
    container.addEventListener('click', (e) => {
        if (!e.target.closest('.torii-link')) {
            const clickX = e.clientX;
            const containerRect = container.getBoundingClientRect();

            // 1. クリック位置のコンテナ中心からのピクセル差 (これが移動量)
            const centerOffset = (clickX - containerRect.left) - (containerRect.width / 2);

            moveAmaterasu(centerOffset);
        }
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.href;

            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // 鳥居の中心に移動
            const linkCenterOffset = (linkRect.left + linkRect.width / 2) - (containerRect.left + containerRect.width / 2);

            // 1. 移動アニメーション実行
            moveAmaterasu(linkCenterOffset);

            // 2. 移動完了後に消えるアニメーション（神隠し）
            setTimeout(() => {
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                // 消えるときも最後の位置を維持
                amaterasu.style.transform = `translateX(-50%) translateX(${linkCenterOffset}px) translateY(-30px)`;

                // 3. 完全に消えた後にページを遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });
});