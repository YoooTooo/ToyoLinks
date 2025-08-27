const pipes = document.querySelectorAll('.pipe');
const amaterasu = document.getElementById('amaterasu');
const container = document.getElementById('link-container');

pipes.forEach(pipe => {
    pipe.addEventListener('click', () => {
        // 土管座標
        const rect = pipe.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const targetLeft = rect.left - containerRect.left + rect.width / 2 - 20;
        const targetTop = rect.top - containerRect.top + rect.height / 2 - 20;

        // 土管光エフェクト
        pipes.forEach(p => p.classList.remove('active'));
        pipe.classList.add('active');

        // ジャンプ
        amaterasu.style.top = targetTop - 50 + 'px';
        amaterasu.style.left = targetLeft + 'px';

        // 0.2秒後に着地＋弾む
        setTimeout(() => {
            amaterasu.style.top = targetTop + 'px';
            amaterasu.style.animation = 'bounce 0.4s';
        }, 200);

        // アニメーションリセット
        setTimeout(() => {
            amaterasu.style.animation = '';
            pipe.classList.remove('active');
        }, 600);

        // 0.6秒後にリンク飛び
        setTimeout(() => {
            window.open(pipe.dataset.url, '_blank');
        }, 600);
    });
});
