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
        omikujiMessage.textContent = '本日のおみくじは終了しました';
        omikujiResetMessage.style.display = 'block';
        return true;
    }

    if (lastDrawDate !== today || now.getTime() >= resetTime.getTime()) {
        localStorage.removeItem('omikujiResult');
        localStorage.removeItem('lastDrawDate');
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

    // ★★★ 修正箇所: 新しいフィールドの反映 ★★★
    document.getElementById('result-omikuji').textContent = resultData.omikuji;
    document.getElementById('result-omikujiyomi').textContent = resultData.omikujiyomi; // 追加
    document.getElementById('result-omikujimeaning').textContent = resultData.omikujimeaning; // 追加
    document.getElementById('result-kanji').textContent = resultData.kanji;
    document.getElementById('result-yomi').textContent = resultData.yomi;
    document.getElementById('result-meaning').textContent = resultData.meaning; // 意味も表示させる前提で追加
    document.getElementById('result-jp').textContent = resultData.jp;
    document.getElementById('result-en').textContent = resultData.en;
    // ★★★ 修正箇所終了 ★★★


    omikujiResultDiv.style.display = 'flex';
    setTimeout(() => {
        omikujiPaper.classList.add('revealed');
    }, 1000);
}

function omikujiAction(boxElement) {
    if (checkOmikujiStatus()) {
        return;
    }

    omikujiBox.classList.add('shaking');
    omikujiBox.style.cursor = 'default';
    omikujiMessage.textContent = '神様が結果を選んでいます...';

    setTimeout(() => {
        omikujiBox.classList.remove('shaking');
        omikujiMessage.textContent = '本日のおみくじ結果';

        const grade = drawOmikuji();
        showResult(grade);

        omikujiResetMessage.style.display = 'block';

    }, 2500);
}

window.restoreOmikujiStateAndPosition = function () {
    // おみくじ結果の復元とアマテラスの位置調整
    const isOmikujiFinished = checkOmikujiStatus();

    // ★修正: 終了していない場合は結果表示コンテナを非表示にしておく (画面が暗くなる問題対策)
    if (!isOmikujiFinished) {
        omikujiResultDiv.style.display = 'none';
    }
    // ★修正終了

    if (isOmikujiFinished) {
        const savedResult = localStorage.getItem('omikujiResult');
        if (savedResult) {
            const resultData = JSON.parse(savedResult);
            // ★★★ 修正箇所: 新しいフィールドの復元 ★★★
            document.getElementById('result-omikuji').textContent = resultData.omikuji;
            document.getElementById('result-omikujiyomi').textContent = resultData.omikujiyomi; // 復元
            document.getElementById('result-omikujimeaning').textContent = resultData.omikujimeaning; // 復元
            document.getElementById('result-kanji').textContent = resultData.kanji;
            document.getElementById('result-yomi').textContent = resultData.yomi;
            document.getElementById('result-meaning').textContent = resultData.meaning; // 復元
            document.getElementById('result-jp').textContent = resultData.jp;
            document.getElementById('result-en').textContent = resultData.en;
            // ★★★ 修正箇所終了 ★★★

            omikujiResultDiv.style.display = 'flex';
            omikujiPaper.classList.add('revealed');
        }

        const boxRect = omikujiBox.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const boxCenterX = (boxRect.left + boxRect.width / 2) - containerRect.left;
        const absoluteBoxX_px = boxCenterX - (amaterasuWidth / 2);
        applyTransform(absoluteBoxX_px, 0);
    }
}

// メインのセットアップ関数 (変更なし)
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

        // ★★★ 修正箇所: タッチイベントロジックの改善 ★★★
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
};