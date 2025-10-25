document.addEventListener('DOMContentLoaded', () => {
    // 既存のアマテラス移動ロジックの定義
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');
    const amaterasuWidth = 120;
    const amaterasuHeight = 180;
    const moveDuration = 400;
    const fadeDuration = 500;
    const INITIAL_BOTTOM_OFFSET = 20;

    // アマテラスにtransformを適用するコア関数
    function applyTransform(xOffset, yOffset) {
        const transformValue = `translateX(${xOffset}px) translateY(${yOffset}px)`;
        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
        amaterasu.style.transform = transformValue;
    }

    // --- 画面全体のクリックイベント (アマテラス移動) ---
    container.addEventListener('click', (e) => {
        // おみくじ箱エリア内または鳥居リンクをクリックした場合はアマテラスを動かさない
        if (e.target.closest('.omikuji-area') || e.target.closest('.torii-link')) {
            return;
        }

        const clickX = e.clientX;
        const clickY = e.clientY;
        const containerRect = container.getBoundingClientRect();

        // X方向の移動量計算
        const relativeClickX = clickX - containerRect.left;
        const absoluteX_px = relativeClickX - (amaterasuWidth / 2);

        // Y方向の移動量計算
        const bottomOfContainer = containerRect.top + containerRect.height;
        const distance_from_bottom = bottomOfContainer - clickY;
        const y_offset_from_bottom = distance_from_bottom - INITIAL_BOTTOM_OFFSET;
        const transformY_px = -y_offset_from_bottom;

        applyTransform(absoluteX_px, transformY_px);
    });

    // --- リンク（鳥居）のクリックイベント ---
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetUrl = link.href;

            // X方向の移動量計算
            const linkRect = link.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            const linkCenterX = (linkRect.left + linkRect.width / 2) - containerRect.left;
            const absoluteLinkX_px = linkCenterX - (amaterasuWidth / 2);

            // リンクに移動する際、Y軸の変動をなくす
            const y_pos_link_click = 0;

            applyTransform(absoluteLinkX_px, y_pos_link_click);

            setTimeout(() => {
                // キャラクターをフェードアウトさせる
                amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
                amaterasu.style.opacity = '0';

                // フェードアウトと同時に少し上に移動する演出
                const final_fade_transform = `translateX(${absoluteLinkX_px}px) translateY(-30px)`;
                amaterasu.style.transform = final_fade_transform;

                // フェードアウト後、ページ遷移
                setTimeout(() => {
                    window.location.href = targetUrl;
                }, fadeDuration);

            }, moveDuration);
        });
    });

    // ★ページロード時の初期位置設定
    // コンテナの幅を元にアマテラスを中央に配置
    const initialPositionX = (container.clientWidth / 2) - (amaterasuWidth / 2);
    applyTransform(initialPositionX, 0);

    // =========================================================
    // ★★★ おみくじロジックの追加 ★★★
    // =========================================================

    const omikujiBox = document.getElementById('omikuji-box');
    const omikujiResultDiv = document.getElementById('omikuji-result');
    const omikujiPaper = document.querySelector('.omikuji-paper');
    const omikujiMessage = document.getElementById('omikuji-message');
    const omikujiResetMessage = document.getElementById('omikuji-reset-message');

    // 確率テーブル (合計100)
    const PROBABILITY_TABLE = [
        { grade: 'DAIKICHI', prob: 5 },  // 大吉: 5%
        { grade: 'CHUKICHI', prob: 20 }, // 中吉: 20%
        { grade: 'SYOKICHI', prob: 20 }, // 小吉: 20%
        { grade: 'SUEKICHI', prob: 20 }, // 末吉: 20%
        { grade: 'KYO', prob: 20 },      // 凶: 20%
        { grade: 'DAIKYO', prob: 15 }   // 大凶: 15% (合計100%になるように調整)
    ];

    // Base64デコード関数 (暗号化解除)
    function decodeBase64(encoded) {
        try {
            // btoaはUTF-8を考慮しないため、TextDecoderを使うことで日本語のデコードエラーを防ぐ
            const bytes = atob(encoded);
            const charCode = new Uint8Array(bytes.length);
            for (let i = 0; i < bytes.length; i++) {
                charCode[i] = bytes.charCodeAt(i);
            }
            return JSON.parse(new TextDecoder().decode(charCode));
        } catch (e) {
            console.error("Base64 Decode Error:", e);
            return { omikuji: '???', kanji: '??', yomi: 'よみ', jp: 'データエラーが発生しました', en: 'Data error occurred' };
        }
    }

    // 1. おみくじの制限チェック (ローカルタイムの正午12時にリセット)
    function checkOmikujiStatus() {
        const lastDrawDate = localStorage.getItem('lastDrawDate');
        const now = new Date();
        const today = now.toDateString();

        // リセット時刻（本日の正午12:00）を設定
        const resetTime = new Date(now);
        resetTime.setHours(12, 0, 0, 0);

        // 現在時刻が正午12時を過ぎていたら、リセット時刻を「翌日」の12時に設定
        if (now.getHours() >= 12) {
            resetTime.setDate(now.getDate() + 1);
        }

        // 最後の引いた日付と今日の日付が一致している、かつ、現在時刻がリセット時刻（翌日正午）を過ぎていない場合
        if (lastDrawDate === today && localStorage.getItem('omikujiResult')) {
            // 本日既に引いている場合は引けない状態にする
            omikujiBox.style.cursor = 'default';
            omikujiMessage.textContent = '本日のおみくじは終了しました';
            omikujiResetMessage.style.display = 'block';
            return true;
        }

        // リセット時刻を過ぎていたら、または本日初めてであれば、状態をクリア
        if (lastDrawDate !== today || now.getTime() >= resetTime.getTime()) {
            localStorage.removeItem('omikujiResult');
            localStorage.removeItem('lastDrawDate');
            return false;
        }
    }

    // 2. おみくじを引く（確率計算）
    function drawOmikuji() {
        let total = 0;
        PROBABILITY_TABLE.forEach(item => total += item.prob);
        const rand = Math.random() * total;
        let cumulative = 0;

        for (const item of PROBABILITY_TABLE) {
            cumulative += item.prob;
            if (rand < cumulative) {
                return item.grade;
            }
        }
        return PROBABILITY_TABLE[0].grade; // フォールバック (大吉)
    }

    // 3. 結果の表示
    function showResult(grade) {
        // 漢字データを取得
        const kanjiArray = OMIIKUJI_DATA_RAW[grade];
        const randomIndex = Math.floor(Math.random() * kanjiArray.length);
        const encodedData = kanjiArray[randomIndex];

        // デコードして結果を取得
        const resultData = decodeBase64(encodedData);

        // ローカルストレージに結果を保存
        localStorage.setItem('omikujiResult', JSON.stringify(resultData));
        localStorage.setItem('lastDrawDate', new Date().toDateString());

        // UIに反映
        document.getElementById('result-omikuji').textContent = resultData.omikuji;
        document.getElementById('result-kanji').textContent = resultData.kanji;
        document.getElementById('result-yomi').textContent = resultData.yomi;
        document.getElementById('result-jp').textContent = resultData.jp;
        document.getElementById('result-en').textContent = resultData.en;

        omikujiResultDiv.style.display = 'flex';
        // 揺れアニメーション後に紙を出すため、遅延
        setTimeout(() => {
            omikujiPaper.classList.add('revealed');
        }, 1000);

        // アマテラスを箱の位置に移動させる (アマテラスの移動演出)
        const boxRect = omikujiBox.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        const boxCenterX = (boxRect.left + boxRect.width / 2) - containerRect.left;
        const absoluteBoxX_px = boxCenterX - (amaterasuWidth / 2);

        const y_pos_box_click = 0;
        applyTransform(absoluteBoxX_px, y_pos_box_click);
    }

    // 4. クリックハンドラ
    omikujiBox.addEventListener('click', () => {
        if (checkOmikujiStatus()) {
            // 既に引いている場合は何もしない
            return;
        }

        // 演出開始
        omikujiBox.classList.add('shaking');
        omikujiBox.style.cursor = 'default';
        omikujiMessage.textContent = '神様が結果を選んでいます...';

        // 演出アニメーションが終了したら結果を出す
        setTimeout(() => {
            omikujiBox.classList.remove('shaking');
            omikujiMessage.textContent = '本日のおみくじ結果';

            const grade = drawOmikuji();
            showResult(grade);

            // 終了メッセージを表示
            omikujiResetMessage.style.display = 'block';

        }, 2500); // 揺れ時間2.5秒
    });

    // 5. 初期ロード時の状態チェック
    if (checkOmikujiStatus()) {
        // 既に引いている場合は結果を復元
        const savedResult = localStorage.getItem('omikujiResult');
        if (savedResult) {
            const resultData = JSON.parse(savedResult);
            // UIに反映
            document.getElementById('result-omikuji').textContent = resultData.omikuji;
            document.getElementById('result-kanji').textContent = resultData.kanji;
            document.getElementById('result-yomi').textContent = resultData.yomi;
            document.getElementById('result-jp').textContent = resultData.jp;
            document.getElementById('result-en').textContent = resultData.en;

            omikujiResultDiv.style.display = 'flex';
            omikujiPaper.classList.add('revealed');
        }

        // アマテラスを箱の位置に移動させる (初期位置)
        const boxRect = omikujiBox.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const boxCenterX = (boxRect.left + boxRect.width / 2) - containerRect.left;
        const absoluteBoxX_px = boxCenterX - (amaterasuWidth / 2);
        applyTransform(absoluteBoxX_px, 0);

    }
});