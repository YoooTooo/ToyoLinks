// =========================================================
// amaterasu-movement.js: アマテラスの移動制御
// =========================================================

// グローバルな変数を window オブジェクトから取得 (script.jsで定義済み)
window.isDragging = false; // 🚨 修正: window スコープで宣言し、グローバル化

let isClick = true;
let dragOffsetX = 0;
let dragOffsetY = 0;

// ユーティリティ関数
window.getCurrentPosition = function () {
    const style = window.getComputedStyle(amaterasu);
    const matrix = new WebKitCSSMatrix(style.transform);
    return { x: matrix.m41, y: matrix.m42 };
};

window.applyTransform = function (xOffset, yOffset) {
    const transformValue = `translateX(${xOffset}px) translateY(${yOffset}px)`;
    amaterasu.style.transition = `transform ${moveDuration}ms ease-in-out`;
    amaterasu.style.transform = transformValue;
};

// =======================
// ドラッグロジック
// =======================

const dragMove = (e) => handleDragMove(e);
const endDrag = (e) => handleDragEnd(e);

function startDrag(e) {
    if (window.isSelecting) return;

    e.stopPropagation();
    isClick = true;
    window.isDragging = true; // 🚨 修正: window.isDragging を使用
    container.classList.add('dragging');

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const currentPos = getCurrentPosition();
    let initialCharX = currentPos.x;
    let initialCharY = currentPos.y;

    // 幽体離脱防止のオフセット計算
    const containerRect = container.getBoundingClientRect();
    const clickXInContainer = clientX - containerRect.left;
    const clickYInContainer = clientY - containerRect.top;

    dragOffsetX = clickXInContainer - initialCharX;
    dragOffsetY = clickYInContainer - initialCharY;

    amaterasu.style.transition = 'none';

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    document.addEventListener('touchcancel', endDrag);
}

function handleDragMove(e) {
    if (!window.isDragging) return; // 🚨 修正: window.isDragging を使用
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const containerRect = container.getBoundingClientRect();
    const clickXInContainer = clientX - containerRect.left;
    const clickYInContainer = clientY - containerRect.top;

    let newX = clickXInContainer - dragOffsetX;
    let newY = clickYInContainer - dragOffsetY;

    if (Math.abs(newX - getCurrentPosition().x) > 5 || Math.abs(newY - getCurrentPosition().y) > 5) {
        isClick = false;
    }

    // 境界チェック
    const maxX = containerRect.width - amaterasuWidth;
    const minX = 0;
    const maxY = 0;
    const containerBottomY = containerRect.height;
    const minY = -(containerBottomY - amaterasuHeight - INITIAL_BOTTOM_OFFSET);

    newX = Math.max(minX, Math.min(maxX, newX));
    newY = Math.min(maxY, newY);

    amaterasu.style.transform = `translateX(${newX}px) translateY(${newY}px)`;
}

function handleDragEnd(e) {
    if (!window.isDragging) return; // 🚨 修正

    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
    document.removeEventListener('touchcancel', endDrag);

    window.isDragging = false; // 🚨 修正
    container.classList.remove('dragging');

    // タップ時（isClick=true）は移動しない
}

// =======================
// 背景クリックロジック
// =======================

function handleBackgroundClick(e) {
    // キャラクター自体、またはホバー要素をクリックした場合は無視
    if (e.target.closest('#amaterasu-char') || e.target.closest('.torii-link') || e.target.closest('.omikuji-area')) {
        return;
    }

    const clickX = e.clientX;
    const clickY = e.clientY;
    const containerRect = container.getBoundingClientRect();

    // X方向の移動量計算 (クリック位置をキャラクターの中心にする)
    const relativeClickX = clickX - containerRect.left;
    const targetX = relativeClickX - (amaterasuWidth / 2);

    // Y方向の移動量計算 (クリック位置にキャラクターの足元を合わせる)
    const bottomOfContainer = containerRect.top + containerRect.height;
    const distance_from_bottom = bottomOfContainer - clickY;
    const y_offset_from_bottom = distance_from_bottom - INITIAL_BOTTOM_OFFSET;
    let targetY = -y_offset_from_bottom;

    // 境界チェックの適用
    const maxY = 0;
    const containerBottomY = containerRect.height;
    const minY = -(containerBottomY - amaterasuHeight - INITIAL_BOTTOM_OFFSET);

    targetY = Math.min(maxY, targetY);
    targetY = Math.max(minY, targetY);

    applyTransform(targetX, targetY);
}

// メインのセットアップ関数 (script.jsから呼び出される)
window.setupAmaterasuMovement = function () {
    amaterasu.addEventListener('mousedown', startDrag);
    amaterasu.addEventListener('touchstart', startDrag, { passive: true });
    container.addEventListener('click', handleBackgroundClick);
};