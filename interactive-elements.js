// =========================================================
// reactive-elements.js: ホバーロードとおみくじロジック
// =========================================================

// グローバルな変数を window オブジェクトから取得 (script.jsで定義済み)
window.isSelecting = false;
let hoverTimer = null;

// omikuji_data.jsが先に読み込まれている前提
const PROBABILITY_TABLE = [
    { grade: 'DAIKICHI', prob: 10 },
    { grade: 'CHUKICHI', prob: 20 },
    { grade: 'SYOKICHI', prob: 20 },
    { grade: 'SUEKICHI', prob: 20 },
    { grade: 'KYO', prob: 20 },
    { grade: 'DAIKYO', prob: 10 }
];


function decodeBase64(encoded) {
    try {
        // 1. Base64文字列をバイナリ文字列としてデコード
        const binaryString = atob(encoded);

        // 2. バイナリ文字列をUTF-8バイト配列に変換（文字化けを防ぐ要所）
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            // charCodeAt()は0〜255のバイト値を返すため、Latin1を経由しても値は保持される
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 3. UTF-8バイト配列をTextDecoderでJSON文字列に変換
        const jsonString = new TextDecoder('utf-8').decode(bytes);

        // 4. JSON文字列をパースしてオブジェクトを返す
        return JSON.parse(jsonString);

    } catch (e) {
        console.error("Base64 Decode Error:", e);
        // エラー時のデータ（エラー時に新しいフィールドも含むように修正済み）
        return { omikuji: '???', kanji: '??', yomi: 'よみ', omikujiyomi: 'error', omikujimeaning: 'Data Error', meaning: 'error', jp: 'データエラーが発生しました', en: 'Data error occurred' };
    }
}

// =======================
// ホバーロードロジック (変更なし)
// =======================

function createIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('loading-indicator');
    return indicator;
}

function startHover(e, actionCallback) {
    // 🚨 修正: ドラッグ中、または既に選択処理中の場合は処理を中止
    if (window.isSelecting || window.isDragging) return;

    window.isSelecting = true;
    const targetElement = e.currentTarget;

    const elementRect = targetElement.closest('.omikuji-area') ? omikujiArea.getBoundingClientRect() : targetElement.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const elementCenterX = (elementRect.left + elementRect.width / 2) - containerRect.left;
    const absoluteX_px = elementCenterX - (amaterasuWidth / 2);
    applyTransform(absoluteX_px, 0);

    targetElement.classList.add('hovering');

    hoverTimer = setTimeout(() => {
        if (window.isSelecting) {
            actionCallback(targetElement);
            stopHover(targetElement);
        }
    }, HOVER_LOAD_TIME);
}

function stopHover(targetElement) {
    clearTimeout(hoverTimer);
    targetElement.classList.remove('hovering');
    window.isSelecting = false;
    const indicator = targetElement.querySelector('.loading-indicator');
    if (indicator) {
        indicator.style.transition = 'none';
        indicator.style.width = '0';
        indicator.style.opacity = '0';
        setTimeout(() => {
            indicator.style.transition = 'width 1s linear';
        }, 50);
    }
}

function linkAction(linkElement) {
    amaterasu.style.transition = `opacity ${fadeDuration}ms ease-out, transform ${fadeDuration}ms ease-out`;
    amaterasu.style.opacity = '0';

    const final_fade_transform = getCurrentPosition().x;
    amaterasu.style.transform = `translateX(${final_fade_transform}px) translateY(-30px)`;

    setTimeout(() => {
        window.location.href = linkElement.href;
    }, fadeDuration);
}

// =======================
// おみくじロジック
// =======================

window.checkOmikujiStatus = function () {
    const lastDrawDate = localStorage.getItem('lastDrawDate');
    const now = new Date();
    const today = now.toDateString();

    const resetTime = new Date(now);
    resetTime.setHours(12, 0, 0, 0);

    if (now.getHours() >= 12) {
        resetTime.setDate(now.getDate() + 1);
    }

    if (lastDrawDate === today && localStorage.getItem('omikujiResult')) {
        omikujiBox.style.cursor = 'default';

        // ★★★ 修正箇所: メッセージの変更 ★★★
        omikujiMessage.innerHTML = '本日のおみくじは終了しました。<br><span class="en-message">Tap to view your result again.</span>';
        // ★★★ 修正箇所終了 ★★★

        omikujiResetMessage.style.display = 'block';
        return true;
    }

    if (lastDrawDate !== today || now.getTime() >= resetTime.getTime()) {
        localStorage.removeItem('omikujiResult');
        localStorage.removeItem('lastDrawDate');

        // ★修正: 初期状態のメッセージに戻す
        omikujiMessage.innerHTML = 'タップするとおみくじが引けます<br><span class="en-message">Tap to draw your omikuji (fortune).</span>';

        return false;
    }
}

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
    return PROBABILITY_TABLE[0].grade;
}

function showResult(grade) {
    // OMIIKUJI_DATA_RAWは omikuji_data.js でグローバル変数として定義されている前提
    const kanjiArray = OMIIKUJI_DATA_RAW[grade];
    const randomIndex = Math.floor(Math.random() * kanjiArray.length);
    const encodedData = kanjiArray[randomIndex];

    const resultData = decodeBase64(encodedData);

    localStorage.setItem('omikujiResult', JSON.stringify(resultData));
    localStorage.setItem('lastDrawDate', new Date().toDateString());

    // ★★★ 新しいフィールドの反映 (変更なし) ★★★
    document.getElementById('result-omikuji').textContent = resultData.omikuji;
    document.getElementById('result-omikujiyomi').textContent = resultData.omikujiyomi;
    document.getElementById('result-omikujimeaning').textContent = resultData.omikujimeaning;
    document.getElementById('result-kanji').textContent = resultData.kanji;
    document.getElementById('result-yomi').textContent = resultData.yomi;
    document.getElementById('result-meaning').textContent = resultData.meaning;
    document.getElementById('result-jp').textContent = resultData.jp;
    document.getElementById('result-en').textContent = resultData.en;
    // ★★★ 終了 ★★★


    omikujiResultDiv.style.display = 'flex';
    setTimeout(() => {
        omikujiPaper.classList.add('revealed');
    }, 1000);
}

// ★★★ おみくじ結果を閉じる関数 (変更なし) ★★★
function closeOmikujiResult() {
    omikujiPaper.classList.remove('revealed');
    // アニメーションが終わってからオーバーレイを閉じる
    setTimeout(() => {
        omikujiResultDiv.style.display = 'none';
    }, 1500); // CSSの transition時間 (1.5s) に合わせる
}
// ★★★ 終了 ★★★


function omikujiAction(boxElement) {

    // ★★★ 修正箇所: メッセージを「結果を見る」内容に統一 ★★★
    if (checkOmikujiStatus()) {
        // 既に終了している場合は、結果を表示する (いつでも見れる機能)
        const savedResult = localStorage.getItem('omikujiResult');
        if (savedResult) {
            // 既に結果が引かれている場合は、復元ロジックを利用して表示
            restoreOmikujiStateAndPosition();
            omikujiResultDiv.style.display = 'flex';
            omikujiPaper.classList.add('revealed');
        }
        return;
    }
    // ★★★ 修正箇所終了 ★★★

    omikujiBox.classList.add('shaking');
    omikujiBox.style.cursor = 'default';
    omikujiMessage.textContent = '神様が結果を選んでいます...';

    setTimeout(() => {
        omikujiBox.classList.remove('shaking');

        // ★★★ 修正箇所: 結果表示後のメッセージを更新 ★★★
        omikujiMessage.innerHTML = '本日のおみくじは終了しました。<br><span class="en-message">Tap to view your result again.</span>';
        // ★★★ 修正箇所終了 ★★★

        const grade = drawOmikuji();
        showResult(grade);

        omikujiResetMessage.style.display = 'block';

    }, 2500);
}

window.restoreOmikujiStateAndPosition = function () {

    // ★★★ 修正: 確実に非表示にリセットする (変更なし) ★★★
    if (omikujiResultDiv) {
        omikujiResultDiv.style.display = 'none';
    }
    // ★★★ 修正終了 ★★★

    // おみくじ結果の復元とアマテラスの位置調整
    const isOmikujiFinished = checkOmikujiStatus();

    // isOmikujiFinished が true の場合、checkOmikujiStatus内でメッセージが更新されているはず

    if (isOmikujiFinished) {
        const savedResult = localStorage.getItem('omikujiResult');
        if (savedResult) {
            const resultData = JSON.parse(savedResult);
            // ★★★ 新しいフィールドの復元 (変更なし) ★★★
            document.getElementById('result-omikuji').textContent = resultData.omikuji;
            document.getElementById('result-omikujiyomi').textContent = resultData.omikujiyomi;
            document.getElementById('result-omikujimeaning').textContent = resultData.omikujimeaning;
            document.getElementById('result-kanji').textContent = resultData.kanji;
            document.getElementById('result-yomi').textContent = resultData.yomi;
            document.getElementById('result-meaning').textContent = resultData.meaning;
            document.getElementById('result-jp').textContent = resultData.jp;
            document.getElementById('result-en').textContent = resultData.en;
            // ★★★ 修正箇所終了 ★★★

            // omikujiResultDiv.style.display = 'flex'; // omikujiActionで実行するためコメントアウト
            // omikujiPaper.classList.add('revealed'); // omikujiActionで実行するためコメントアウト
        }

        const boxRect = omikujiBox.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const boxCenterX = (boxRect.left + boxRect.width / 2) - containerRect.left;
        const absoluteBoxX_px = boxCenterX - (amaterasuWidth / 2);
        applyTransform(absoluteBoxX_px, 0);
    }
}

// メインのセットアップ関数
window.setupInteractiveElements = function () {
    const selectableElements = [...links, omikujiBox];
    selectableElements.forEach(el => {
        if (!el.querySelector('.loading-indicator')) {
            el.appendChild(createIndicator());
        }

        const isOmikuji = el.closest('.omikuji-area');
        const actionCallback = isOmikuji ? omikujiAction : linkAction;

        // マウスイベント
        el.addEventListener('mouseenter', (e) => startHover(e, actionCallback));
        el.addEventListener('mouseleave', (e) => stopHover(e.currentTarget));

        // ★★★ タッチイベントロジック (変更なし) ★★★
        let touchStartTime = 0;
        const TOUCH_CLICK_THRESHOLD = 200; // 200ms以内に指を離したらクリックと見なす

        el.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            clearTimeout(hoverTimer);
            // 長押しを検知するためのホバータイマーを設定
            hoverTimer = setTimeout(() => startHover(e, actionCallback), HOVER_LOAD_TIME);
        }, { passive: true });

        el.addEventListener('touchend', (e) => {
            clearTimeout(hoverTimer);

            const duration = Date.now() - touchStartTime;

            if (duration < TOUCH_CLICK_THRESHOLD && !window.isSelecting) {
                // 短時間タップ（クリック）と判断
                if (isOmikuji) {
                    omikujiAction(e.currentTarget);
                } else {
                    linkAction(e.currentTarget);
                }
            }

            // ホバーが発動した場合は停止処理
            if (window.isSelecting) {
                stopHover(e.currentTarget);
            }
        });

        el.addEventListener('touchcancel', (e) => {
            clearTimeout(hoverTimer);
            stopHover(e.currentTarget);
        });

        // PCのクリックイベント
        if (!isOmikuji) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (!window.isSelecting) {
                    linkAction(e.currentTarget);
                }
            });
        } else {
            el.addEventListener('click', (e) => {
                if (!window.isSelecting) {
                    omikujiAction(e.currentTarget);
                }
            });
        }
    });

    // ★★★ 修正箇所: おみくじ結果オーバーレイを閉じるためのイベントリスナー ★★★
    if (omikujiResultDiv) {
        omikujiResultDiv.addEventListener('click', (e) => {
            // おみくじ紙自体（.omikuji-paper-design）がクリックされた場合は閉じないようにする
            // オーバーレイの黒い部分がクリックされたら閉じる
            if (e.target === omikujiResultDiv) {
                closeOmikujiResult();
            }
        });

        // ★削除: おみくじ紙自体に設定されていたイベントリスナーを削除します。
        // omikujiPaper.addEventListener('click', closeOmikujiResult); 
    }
    // ★★★ 修正箇所終了 ★★★
};