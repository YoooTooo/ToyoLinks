document.addEventListener('DOMContentLoaded', () => {
    // 既存の要素の定義
    const amaterasu = document.getElementById('amaterasu-char');
    const container = document.querySelector('.portal-container');
    const links = document.querySelectorAll('.torii-link');
    const omikujiArea = document.querySelector('.omikuji-area');
    const omikujiBox = document.getElementById('omikuji-box');
    const omikujiResultDiv = document.getElementById('omikuji-result');
    const omikujiPaper = document.querySelector('.omikuji-paper');
    const omikujiMessage = document.getElementById('omikuji-message');
    const omikujiResetMessage = document.getElementById('omikuji-reset-message');

    const amaterasuWidth = 120;
    const moveDuration = 400;
    const fadeDuration = 500;
    const INITIAL_BOTTOM_OFFSET = 20;
    const HOVER_LOAD_TIME = 1000;

    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let initialCharX = 0;
    let initialCharY = 0;
    let isClick = true;
    let hoverTimer = null;
    let isSelecting = false;

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

    // アマテラスにtransformを適用するコア関数
    function applyTransform(xOffset, yOffset) {
        const transformValue = `translateX(${xOffset}px) translateY(${yOffset}px)`;
        amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
        amaterasu.style.transform = transformValue;
    }

    // 現在のアマテラスの位置を取得する関数
    function getCurrentPosition() {
        const style = window.getComputedStyle(amaterasu);
        const matrix = new WebKitCSSMatrix(style.transform);
        return { x: matrix.m41, y: matrix.m42 };
    }

    // =========================================================
    // ★★★ 修正されたドラッグ移動ロジック ★★★
    // =========================================================

    // イベントリスナーを解除するために、関数参照を維持
    const dragMove = (e) => handleDragMove(e);
    const endDrag = (e) => handleDragEnd(e);

    // ドラッグ開始
    container.addEventListener('mousedown', startDrag);
    container.addEventListener('touchstart', startDrag, { passive: true });

    function startDrag(e) {
        // 🚨 画面全体をドラッグ領域にするため、以下の判定を削除
        /*
        if (e.target.closest('.torii-link') || e.target.closest('.omikuji-area')) {
            return;
        }
        */

        // ホバーロード中はドラッグも無効
        if (isSelecting) {
            return;
        }

        isClick = true;
        isDragging = true;
        container.classList.add('dragging');

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragStartX = clientX;
        dragStartY = clientY;

        const currentPos = getCurrentPosition();
        initialCharX = currentPos.x;
        initialCharY = currentPos.y; // 🚨 ドラッグ開始時のY位置を保持

        amaterasu.style.transition = 'none'; // ドラッグ中はアニメーションを無効化

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('touchmove', dragMove, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
        document.addEventListener('touchcancel', endDrag);
    }

    // ドラッグ中 (前回修正済み)
    function handleDragMove(e) {
        if (!isDragging) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const dx = clientX - dragStartX;
        const dy = clientY - dragStartY;

        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
            isClick = false;
        }

        let newX = initialCharX + dx;
        let newY = initialCharY + dy;

        const containerRect = container.getBoundingClientRect();
        const maxX = containerRect.width - amaterasuWidth;
        const minX = 0;
        const maxY = 0;
        const containerBottomY = containerRect.height;
        const minY = -(containerBottomY - amaterasu.offsetHeight - INITIAL_BOTTOM_OFFSET);

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.min(maxY, newY);

        amaterasu.style.transform = `translateX(${newX}px) translateY(${newY}px)`;
    }

    // ドラッグ終了
    function handleDragEnd(e) {
        if (!isDragging) return;

        // イベントリスナーを確実に解除
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('touchmove', dragMove);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        document.removeEventListener('touchcancel', endDrag);

        isDragging = false;
        container.classList.remove('dragging');

        // クリックだった場合の処理（ドラッグなしでマウスアップ/タップアップ）
        if (isClick) {
            const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
            const containerRect = container.getBoundingClientRect();

            const relativeClickX = clientX - containerRect.left;
            const targetX = relativeClickX - (amaterasuWidth / 2);

            // 🚨 Y軸は現在の位置を維持（ジャンプ後の位置など）。0にスナップしない。
            const targetY = getCurrentPosition().y;

            // アニメーションを有効に戻して移動
            applyTransform(targetX, targetY);
        }
    }

    // =========================================================
    // ★★★ ホバーロード（長押し）ロジック ★★★
    // =========================================================

    const selectableElements = [...links, omikujiBox];

    function createIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('loading-indicator');
        return indicator;
    }

    selectableElements.forEach(el => {
        if (!el.querySelector('.loading-indicator')) {
            el.appendChild(createIndicator());
        }
    });

    function startHover(e, actionCallback) {
        // ホバー要素上でドラッグ開始された場合、ドラッグとホバーが同時に始まるのを防ぐ
        if (isSelecting || isDragging) return;
        isSelecting = true;
        const targetElement = e.currentTarget;

        // アマテラスを要素の上に移動させる (演出)
        const elementRect = targetElement.closest('.omikuji-area') ? omikujiArea.getBoundingClientRect() : targetElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const elementCenterX = (elementRect.left + elementRect.width / 2) - containerRect.left;
        const absoluteX_px = elementCenterX - (amaterasuWidth / 2);
        applyTransform(absoluteX_px, 0);

        targetElement.classList.add('hovering');

        hoverTimer = setTimeout(() => {
            if (isSelecting) {
                actionCallback(targetElement);
                stopHover(targetElement);
            }
        }, HOVER_LOAD_TIME);
    }

    function stopHover(targetElement) {
        clearTimeout(hoverTimer);
        targetElement.classList.remove('hovering');
        isSelecting = false;
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

    // イベントリスナーのセットアップ
    selectableElements.forEach(el => {
        const isOmikuji = el.closest('.omikuji-area');
        const actionCallback = isOmikuji ? omikujiAction : linkAction;

        // マウスイベント
        el.addEventListener('mouseenter', (e) => startHover(e, actionCallback));
        el.addEventListener('mouseleave', (e) => stopHover(e.currentTarget));

        // タッチイベント
        let touchStartTimer;
        el.addEventListener('touchstart', (e) => {
            e.preventDefault();
            touchStartTimer = setTimeout(() => startHover(e, actionCallback), 50);
        }, { passive: false });

        el.addEventListener('touchend', (e) => {
            clearTimeout(touchStartTimer);
            if (!isSelecting) {
                stopHover(e.currentTarget);
            }
        });

        el.addEventListener('touchcancel', (e) => {
            clearTimeout(touchStartTimer);
            stopHover(e.currentTarget);
        });

        // 鳥居リンクはクリック（短押し）でも移動できるようにしておく
        if (!isOmikuji) {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                // ホバーロードが発動していない短時間のクリックでのみ移動
                if (!isSelecting) {
                    linkAction(e.currentTarget);
                }
            });
        }
    });

    // =========================================================
    // ★★★ おみくじロジックのヘルパー関数 (変更なし) ★★★
    // =========================================================

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

    // 6. 初期ロード時の状態設定
    const isOmikujiFinished = checkOmikujiStatus();

    // 初期配置の調整
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

    } else {
        const initialPositionX = (container.clientWidth / 2) - (amaterasuWidth / 2);
        applyTransform(initialPositionX, 0);
    }
});