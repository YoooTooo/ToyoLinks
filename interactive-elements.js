// =========================================================
// reactive-elements.js: ホバーロードとおみくじロジック
// =========================================================

// グローバルな変数を window オブジェクトから取得 (script.jsで定義済み)
window.isSelecting = false;
let hoverTimer = null;

// ★★★ 修正箇所: 新しいフラグを導入 ★★★
window.isOmikujiOpen = false; // おみくじ結果が表示されているか
let closeGuardTimer = null;   // 連続タップによる誤動作を防ぐためのタイマー
const CLOSE_GUARD_TIME = 500; // 500ms は閉じる操作を無視する
// ★★★ 修正箇所終了 ★★★


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

        // メッセージの変更 (再表示を促す)
        omikujiMessage.innerHTML = '本日のおみくじは終了しました。<br><span class="en-message">Tap to view your result again.</span>';

        omikujiResetMessage.style.display = 'block';
        return true;
    }

    if (lastDrawDate !== today || now.getTime() >= resetTime.getTime()) {
        localStorage.removeItem('omikujiResult');
        localStorage.removeItem('lastDrawDate');

        // 初期状態のメッセージに戻す
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

        // ★★★ 修正箇所: アニメーション後にフラグを立て、閉じる操作を受け付ける ★★★
        window.isOmikujiOpen = true;
        clearTimeout(closeGuardTimer); // 念のため既存タイマーをクリア
        // ★★★ 修正箇所終了 ★★★

    }, 1000);
}

// ★★★ おみくじ結果を閉じる関数 (ガードロジックを追加) ★★★
function closeOmikujiResult() {
    // ★★★ 修正箇所: フラグを確認し、閉じられる状態かチェック ★★★
    if (!window.isOmikujiOpen) {
        // まだ開いていない、またはガード期間中のため無視
        return;
    }
    window.isOmikujiOpen = false; // 閉じるアニメーション開始と同時にフラグを倒す
    // ★★★ 修正箇所終了 ★★★

    omikujiPaper.classList.remove('revealed');

    // アニメーションが終わってからオーバーレイを閉じる
    setTimeout(() => {
        omikujiResultDiv.style.display = 'none';
    }, 1500); // CSSの transition時間 (1.5s) に合わせる
}
// ★★★ 修正箇所終了 ★★★


function omikujiAction(boxElement) {

    // ★★★ 修正箇所: おみくじ結果が表示中（かつ閉じる準備ができている）の場合は、タップを無視して競合を防ぐ ★★★
    if (omikujiResultDiv && omikujiResultDiv.style.display === 'flex' && window.isOmikujiOpen) {
        // 結果表示中に omikujiArea が再度タップされた場合は何もしない
        return;
    } else if (omikujiResultDiv && omikujiResultDiv.style.display === 'flex' && !window.isOmikujiOpen) {
        // 結果表示中だがまだアニメーション中の場合も何もしない
        return;
    }
    // ★★★ 修正箇所終了 ★★★

    if (checkOmikujiStatus()) {
        // 既に終了している場合は、結果を表示する (いつでも見れる機能)
        const savedResult = localStorage.getItem('omikujiResult');
        if (savedResult) {
            // 既に結果が引かれている場合は、復元ロジックを利用して表示
            restoreOmikujiStateAndPosition();

            omikujiResultDiv.style.display = 'flex';
            omikujiPaper.classList.add('revealed');

            // ★★★ 修正箇所: 再表示時もフラグを立てる ★★★
            clearTimeout(closeGuardTimer);
            // アニメーション時間後にフラグを立てる
            closeGuardTimer = setTimeout(() => {
                window.isOmikujiOpen = true;
            }, CLOSE_GUARD_TIME);
            // ★★★ 修正箇所終了 ★★★
        }
        return;
    }

    omikujiBox.classList.add('shaking');
    omikujiBox.style.cursor = 'default';
    omikujiMessage.textContent = '神様が結果を選んでいます...';

    // ★★★ 修正箇所: 新規描画時は一旦フラグを倒しておく ★★★
    window.isOmikujiOpen = false;
    // ★★★ 修正箇所終了 ★★★

    setTimeout(() => {
        omikujiBox.classList.remove('shaking');

        // 結果表示後のメッセージを更新
        omikujiMessage.innerHTML = '本日のおみくじは終了しました。<br><span class="en-message">Tap to view your result again.</span>';

        const grade = drawOmikuji();
        showResult(grade);

        omikujiResetMessage.style.display = 'block';

    }, 2500);
}

window.restoreOmikujiStateAndPosition = function () {

    // 確実に非表示にリセットする (変更なし)
    if (omikujiResultDiv) {
        omikujiResultDiv.style.display = 'none';
        // ★★★ 修正箇所: 初期状態では閉じていると設定 ★★★
        window.isOmikujiOpen = false;
        // ★★★ 修正箇所終了 ★★★
    }

    // おみくじ結果の復元とアマテラスの位置調整
    const isOmikujiFinished = checkOmikujiStatus();

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

        // マウスイベント (変更なし)
        el.addEventListener('mouseenter', (e) => startHover(e, actionCallback));
        el.addEventListener('mouseleave', (e) => stopHover(e.currentTarget));

        // ★★★ タッチイベントロジック (変更なし) ★★★
        let touchStartTime = 0;
        const TOUCH_CLICK_THRESHOLD = 200;

        el.addEventListener('touchstart', (e) => {
            touchStartTime = Date.now();
            clearTimeout(hoverTimer);
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
        // 1. オーバーレイの黒い部分がクリックされたら閉じる
        omikujiResultDiv.addEventListener('click', (e) => {
            if (e.target === omikujiResultDiv) {
                closeOmikujiResult();
            }
        });

        // 2. おみくじ紙自体がクリック/タップされたら閉じる
        omikujiPaper.addEventListener('click', closeOmikujiResult);
    }
    // ★★★ 修正箇所終了 ★★★
};