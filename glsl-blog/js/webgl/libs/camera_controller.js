/**
 * ３Dカメラ制御をするクラス/関数/定数を定義
 */

/**
 * マウスのカメラ制御クラス
 */
class MouseInterctionCamera {

    constructor() {
        // 回転軸など必要設定をしないと動くがおかしくなる
        // nanの結果になるのを防ぐ
        this.rotationQuaternion = new Quaternion();
        this.rotationScale = Math.min(window.innerWidth, window.innerHeight);
        this.rotationAxis = [1.0, 0.0, 0.0];
        this.rotationPower = 0.0;
        this.rotationAttenuation = 0.95;

        this.fovScaleMin = 0.5;
        this.fovScaleMax = 1.5;
        this.fovScalePower = 0.0;
        this.fovScale = 1.0;

        this.prevMousePosition = [0.0, 0.0];
        this.dragging = false;
    }

    /**
     * セットアップ
     * @param {*} canvas 
     */
    setup(canvas) {
        canvas.addEventListener('mousedown', this.startDragEvent.bind(this), false);
        canvas.addEventListener('mousemove', this.moveDragEvent.bind(this), false);
        canvas.addEventListener('mouseup', this.endDragEvent.bind(this), false);
        canvas.addEventListener('wheel', this.wheelEvent.bind(this), false);
    }

    /**
     * マウスドラッグイベント開始
     * @param {*} eve 
     */
    startDragEvent(eve) {
        this.dragging = true;
        // ドラッグ開始時のマウス座標を設定
        this.prevMousePosition = [eve.clientX, eve.clientY];
    }

    /**
     * マウスドラッグ移動イベント
     * @param {*} eve 
     */
    moveDragEvent(eve) {
        if (this.dragging == false) {
            return;
        }

        const x = eve.clientX;
        const y = eve.clientY;

        // 回転軸を作る
        // 1. マウスの移動ベクトルを作る
        const subX = this.prevMousePosition[0] - x;
        const subY = this.prevMousePosition[1] - y;

        // 2. xyを入れ替えて回転軸を作る
        this.rotationAxis = [subY, subX, 0];

        // 回転量を作る
        {
            // 1. マウスの移動量を作る
            const power = Math.sqrt(subX * subX + subY * subY);

            // 2. カメラが拡大時は回転量を抑える、逆に縮小時は回転量を上げる
            //    これは遠方では回転しているのをみやすくするため
            this.rotationPower = power / this.rotationScale;
        }

        // マウス座標を保存
        this.prevMousePosition = [x, y];
    }

    /**
     * マウスドラッグ終了イベント
     */
    endDragEvent() {
        this.dragging = false;
    }

    /**
     * マウスホイールイベント
     * @param {*} eve 
     */
    wheelEvent(eve) {
        const wheel = eve.wheelDelta;
        const scale = 0.1;
        // 前にホイール移動
        if (wheel > 0) {
            this.fovScalePower = -scale;
        }
        // 後ろにホイール移動
        else if (wheel < 0) {
            this.fovScalePower = scale;
        }
    }

    /**
     * 更新
     */
    update() {
        const newFovScale = this.fovScale + this.fovScalePower;
        this.fovScale = Math.max(this.fovScaleMin, Math.min(this.fovScaleMax, newFovScale));

        // クォータニオンで回転
        // クォータニオンの回転量がないなら何もしない
        if (this.rotationPower === 0.0) {
            return;
        }

        const q = new Quaternion();

        this.rotationPower *= this.rotationAttenuation;
        
        q.rotate(this.rotationAxis, this.rotationPower);
        this.rotationQuaternion.multiply(q);
    }
}