document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.torii-link');
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');

    // CSSのトランジション時間をミリ秒で定義
    const moveDuration = 400; // アマテラスが移動する時間 (0.4秒)
    const fadeDuration = 500; // 消えて遷移するまでの待機時間

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // デフォルトのリンク遷移を停止

            const targetUrl = link.href;

            // アマテラスにアニメーションを適用する関数
            function animateAmaterasu(targetX) {
                // 1. まずアマテラスの移動アニメーションを適用
                amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
                amaterasu.style.transform = `translateX(${targetX}px)`;

                // 2. 移動アニメーションが完了するのを待つ (moveDuration)
                setTimeout(() => {
                    // 3. 移動後にフワッと消えるアニメーションに切り替え
                    amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                    amaterasu.style.opacity = '0'; // 透明にする
                    amaterasu.style.transform = `translateX(${targetX}px) translateY(-30px)`; // 少し上へ移動

                    // 4. 完全に消えた後にページを遷移
                    setTimeout(() => {
                        window.location.href = targetUrl; // リンク先へ遷移
                    }, fadeDuration);

                }, moveDuration);
            }

            // --- 位置計算 ---

            // リンクとコンテナの位置情報を取得
            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            // アマテラスの現在地（初期状態）からの相対的な移動距離を計算
            // アマテラスの中心と鳥居の中心が一致するX座標を目標とする
            const linkCenterX = linkRect.left + linkRect.width / 2;
            const containerCenterX = containerRect.left + containerRect.width / 2;

            // アマテラスは初期状態で transform: translateX(-50%) されている
            // したがって、移動目標X座標は「リンクの中心」から「コンテナの中心」を引いた値
            // そして、アマテラスの幅の半分を考慮して、鳥居の前に立てるように微調整
            const targetXRelative = linkCenterX - containerCenterX;

            // アマテラスは自身の幅の50%分左に寄っているので、その補正分を調整
            // 例: -50% (初期位置) から +targetXRelative へ移動

            // 最終的なアマテラスのtransform: translateX(X)のターゲット値
            // アマテラスの幅(120px)の半分の補正を考慮して、鳥居の手前に配置
            const amaterasuWidth = 120; // style.cssに合わせる
            const centerAdjustment = (linkCenterX - containerCenterX);

            // 目標とするtranslateXの値。これによりアマテラスがクリックした鳥居へ移動します。
            const finalTransformX = centerAdjustment - amaterasuWidth / 2;


            // --- アニメーション実行 ---
            animateAmaterasu(finalTransformX);
        });
    });
});