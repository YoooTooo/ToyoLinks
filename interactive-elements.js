// =========================================================
// interactive-elements.js: ホバーロードとおみくじロジック
// =========================================================

// グローバルな変数を window オブジェクトから取得 (script.jsで定義済み)
window.isSelecting = false;
let hoverTimer = null;

// omikuji_data.jsが先に読み込まれている前提
const PROBABILITY_TABLE = [
    { grade: 'DAIKICHI', prob: 5 },
    { grade: 'CHUKICHI', prob: 20 },
    { grade: 'SYOKICHI', prob: 20 },
    { grade: 'SUEKICHI', prob: 20 },
    { grade: 'KYO', prob: 20 },
    { grade: 'DAIKYO', prob: 15 }
];

function decodeBase64(encoded) {
    // ... (前回の decodeBase64 関数を全文移植)
    try {
        const bytes = atob(encoded);
        const charCode = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) {
            charCode[i] = bytes.charCodeAt(i);
        }
        if (typeof OMIIKUJI_DATA_RAW === 'undefined') {
            console.error("omikuji_data.js not loaded.");
        }
        return JSON.parse(new TextDecoder().decode(charCode));
    } catch (e) {
        console.error("Base64 Decode Error:", e);
        return { omikuji: '???', kanji: '??', yomi: 'よみ', jp: 'データエラーが発生しました', en: 'Data error occurred' };
    }
}

// =======================
// ホバーロードロジック
// =======================

function createIndicator() {
    const indicator = document.createElement('div');
    indicator.classList.add('loading-indicator');
    return indicator;
}

function startHover(e, actionCallback) {
    // isDragging は amaterasu-movement.js のローカル変数ですが、
    // ここではグローバルな isSelecting フラグのみをチェックします。
    if (window.isSelecting) return;
    window.isSelecting = true;
    const targetElement = e.currentTarget;

    // アマテラスを要素の上に移動させる (演出)
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

function checkOmikujiStatus() {
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
    const kanjiArray = OMIIKUJI_DATA_RAW[grade];
    const randomIndex = Math.floor(Math.random() * kanjiArray.length);
    const encodedData = kanjiArray[randomIndex];

    const resultData = decodeBase64(encodedData);

    localStorage.setItem('omikujiResult', JSON.stringify(resultData));
    localStorage.setItem('lastDrawDate', new Date().toDateString());

    document.getElementById('result-omikuji').textContent = resultData.omikuji;
    document.getElementById('result-kanji').textContent = resultData.kanji;
    document.getElementById('result-yomi').textContent = resultData.yomi;
    document.getElementById('result-jp').textContent = resultData.jp;
    document.getElementById('result-en').textContent = resultData.en;

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

    if (isOmikujiFinished) {
        const savedResult = localStorage.getItem('omikujiResult');
        if (savedResult) {
            const resultData = JSON.parse(savedResult);
            document.getElementById('result-omikuji').textContent = resultData.omikuji;
            document.getElementById('result-kanji').textContent = resultData.kanji;
            document.getElementById('result-yomi').textContent = resultData.yomi;
            document.getElementById('result-jp').textContent = resultData.jp;
            document.getElementById('result-en').textContent = resultData.en;

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

// メインのセットアップ関数 (script.jsから呼び出される)
window.setupInteractiveElements = function () {
    const selectableElements = [...links, omikujiBox];
    selectableElements.forEach(el => {
        if (!el.querySelector('.loading-indicator')) {
            el.appendChild(createIndicator());
        }

        const isOmikuji = el.closest('.omikuji-area');
        const actionCallback = isOmikuji ? omikujiAction : linkAction;

        el.addEventListener('mouseenter', (e) => startHover(e, actionCallback));
        el.addEventListener('mouseleave', (e) => stopHover(e.currentTarget));

        let touchStartTimer;
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            touchStartTimer = setTimeout(() => startHover(e, actionCallback), 50);
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
            clearTimeout(touchStartTimer);
            if (!window.isSelecting) {
                stopHover(e.currentTarget);
            }
        });

        el.addEventListener('touchcancel', (e) => {
            clearTimeout(touchStartTimer);
            stopHover(e.currentTarget);
        });

        if (!isOmikuji) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                if (!window.isSelecting) {
                    linkAction(e.currentTarget);
                }
            });
        }
    });
};

// omikuji_data.js が先に読み込まれている場合、その後の処理は setupInteractiveElements 内で実行されます