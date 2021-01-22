/**
 * 3D描画キャンバスインターフェイスクラス
 */
class Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        this.data_file_path = data_file_path;
        this.webGL_data_container = webGL_data_container;
    }

    /**
     * 非同期ロード
     * ここでシェーダーやテクスチャー生成する
     */
    load() {
        return new Promise((resolve) => {
            resolve();
        });
    }

    /**
     * メモリやオブジェクトの解放
     */
    dispose() {}

    /**
     * 更新
     */
    update(time) {}

    /**
     * 描画前処理
     */
    beginRender(time) {}

    /**
     * 描画
     */
    render(gl, time) {}

    /**
     * 描画後処理
     */
    afterRender(time) {}
}