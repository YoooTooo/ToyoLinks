document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.torii-link');
    const amaterasu = document.getElementById('amaterasu-char');

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // デフォルトのリンク遷移を一旦停止

            const targetUrl = link.href;

            // 1. アマテラスの画像をリンク（鳥居）の直上に移動させる (演出強化)
            const linkRect = link.getBoundingClientRect();
            const containerRect = document.querySelector('.portal-container').getBoundingClientRect();

            // アマテラスを鳥居の中央へ移動させるY座標を計算
            // （ここではシンプルに、元の位置から消えるアニメーションのみを実装）

            // 2. アニメーションクラスを追加し、「神隠し」演出を開始
            amaterasu.classList.add('is-moving');

            // 3. アニメーションが完了するのを待ってからページを遷移
            // CSSのtransition時間（0.5秒）と合わせる
            setTimeout(() => {
                window.location.href = targetUrl; // リンク先へ遷移
            }, 500); // 500ミリ秒 = 0.5秒
        });
    });
});