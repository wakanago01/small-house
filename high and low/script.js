document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // ポップアップ（モダール）制御ロジック
    // ==========================================
    const btnHowTo = document.getElementById('btn-how-to');
    const btnRules = document.getElementById('btn-rules');
    const modalHowTo = document.getElementById('modal-how-to');
    const modalRules = document.getElementById('modal-rules');
    const closeButtons = document.querySelectorAll('.close-btn');

    // 「遊び方」を開く
    btnHowTo.addEventListener('click', () => {
        modalHowTo.classList.add('is-open');
    });

    // 「ルール説明」を開く
    btnRules.addEventListener('click', () => {
        modalRules.classList.add('is-open');
    });

    // 「閉じる」ボタン、または背景クリックで閉じる処理
    closeButtons.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    function closeModal() {
        modalHowTo.classList.remove('is-open');
        modalRules.classList.remove('is-open');
    }

    // ==========================================
    // 【修正】効果音（SE）再生用の共通関数
    // ==========================================
    const seFlip = document.getElementById('se-flip');

    // ★カードをめくる演出のところで、この関数を呼び出してください
    function playFlipSound() {
        if (seFlip) {
            seFlip.currentTime = 0; // 連続でめくっても頭から再生されるようにリセット
            seFlip.play().catch(err => {
                console.log("オーディオ再生エラー:", err);
            });
        }
    }

    // ==========================================
    // 各ボタンのイベント設定（音を鳴らす処理を削除）
    // ==========================================
    const btnStart = document.getElementById('btn-start');
    const btnCasino = document.getElementById('btn-casino');

    btnStart.addEventListener('click', () => {
        // 【修正】ここでは音を鳴らさないように変更しました
        console.log('ゲーム画面へ遷移、またはゲームボードの生成処理など...');
        
        /* 【開発メモ】
           今後、ゲーム画面ができて「1枚目のカードを表示する関数」や、
           「HIGH/LOWを選んで2枚目のカードを開く関数」を作る際に、
           その処理の中で `playFlipSound();` を呼び出してください！
        */
    });

    btnCasino.addEventListener('click', () => {
        alert('カジノに戻ります。');
    });

});