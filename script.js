// CODE39対応文字
const CODE39_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ-. $/+%';

// 入力値を検証してCODE39対応文字のみを返す
function validateCode39(text) {
    return text.toUpperCase().split('').filter(char => CODE39_CHARS.includes(char)).join('');
}

// 入力値がCODE39対応かチェック
function isValidCode39(text) {
    return text.split('').every(char => CODE39_CHARS.includes(char.toUpperCase()));
}

// メモを取得（LocalStorage）
function getMemos() {
    const data = localStorage.getItem('memos');
    return data ? JSON.parse(data) : [];
}

// メモを保存（LocalStorage）
function saveMemo(text, code) {
    const memos = getMemos();
    const memo = {
        id: Date.now(),
        text: text,
        code: code,
        date: new Date().toLocaleString('ja-JP')
    };
    memos.unshift(memo);
    localStorage.setItem('memos', JSON.stringify(memos));
    return memo;
}

// メモを削除（LocalStorage）
function deleteMemo(id) {
    let memos = getMemos();
    memos = memos.filter(memo => memo.id !== id);
    localStorage.setItem('memos', JSON.stringify(memos));
}

// バーコード表示を更新
function updateBarcode(text) {
    const previewBarcode = document.getElementById('previewBarcode');
    const inputError = document.getElementById('inputError');
    const memoInput = document.getElementById('memoInput');
    const saveBtn = document.getElementById('saveBtn');
    
    if (text.length === 0) {
        previewBarcode.innerHTML = '';
        inputError.textContent = '';
        memoInput.classList.remove('invalid');
        saveBtn.disabled = true;
        return;
    }
    
    // 入力値の検証
    if (!isValidCode39(text)) {
        const invalidChars = text.split('').filter(char => !CODE39_CHARS.includes(char.toUpperCase()));
        const uniqueInvalidChars = [...new Set(invalidChars)].join(', ');
        inputError.textContent = `❌ 無効な文字が含まれています: ${uniqueInvalidChars}`;
        memoInput.classList.add('invalid');
        saveBtn.disabled = true;
        previewBarcode.innerHTML = '';
        return;
    }
    
    // 入力値が有効
    inputError.textContent = '✓ 有効な形式です';
    memoInput.classList.remove('invalid');
    saveBtn.disabled = false;
    
    // CODE39バーコード生成
    const validText = validateCode39(text);
    try {
        JsBarcode("#previewBarcode", validText, {
            format: "CODE39",
            width: 2,
            height: 60,
            displayValue: true,
            fontSize: 14,
            margin: 10
        });
    } catch (error) {
        console.error('バーコード生成エラー:', error);
        inputError.textContent = '❌ バーコード生成に失敗しました';
    }
}

// メモリストを表示
function renderMemoList() {
    const memoList = document.getElementById('memoList');
    const memos = getMemos();
    
    if (memos.length === 0) {
        memoList.innerHTML = '<div class="empty-state">保存されたメモはまだありません</div>';
        return;
    }
    
    memoList.innerHTML = memos.map(memo => `
        <div class="memo-item">
            <div class="memo-item-header">
                <div>
                    <h3>メモ</h3>
                </div>
                <button class="btn btn-delete" onclick="handleDeleteClick(event, ${memo.id})" title="削除">🗑️</button>
            </div>
            <div class="memo-text">${escapeHtml(memo.text)}</div>
            <div class="memo-barcode">
                <svg id="barcode-${memo.id}"></svg>
            </div>
            <div class="memo-date">保存日時: ${memo.date}</div>
        </div>
    `).join('');
    
    // すべてのメモのバーコードを生成
    memos.forEach(memo => {
        try {
            JsBarcode(`#barcode-${memo.id}`, memo.code, {
                format: "CODE39",
                width: 1.5,
                height: 50,
                displayValue: true,
                fontSize: 12,
                margin: 5
            });
        } catch (error) {
            console.error(`バーコード生成エラー (ID: ${memo.id}):`, error);
        }
    });
}

// HTMLエスケープ
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 削除ボタンクリック処理
function handleDeleteClick(event, id) {
    event.stopPropagation();
    if (confirm('本当に削除しますか？')) {
        deleteMemo(id);
        renderMemoList();
    }
}

// イベントリスナー設定
document.addEventListener('DOMContentLoaded', () => {
    const memoInput = document.getElementById('memoInput');
    const saveBtn = document.getElementById('saveBtn');
    
    // 入力時のリアルタイム更新
    memoInput.addEventListener('input', (e) => {
        updateBarcode(e.target.value);
    });
    
    // 保存ボタン
    saveBtn.addEventListener('click', () => {
        const text = memoInput.value.trim();
        if (text && isValidCode39(text)) {
            const validText = validateCode39(text);
            saveMemo(text, validText);
            memoInput.value = '';
            document.getElementById('inputError').textContent = '';
            memoInput.classList.remove('invalid');
            updateBarcode('');
            renderMemoList();
            // フィードバック
            saveBtn.textContent = '✓ 保存しました';
            setTimeout(() => {
                saveBtn.textContent = '💾 保存';
            }, 1500);
        } else {
            alert('有効なメモを入力してください');
        }
    });
    
    // ページ読み込み時にメモリストを表示
    renderMemoList();
});
