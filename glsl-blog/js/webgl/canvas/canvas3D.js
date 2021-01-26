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
        // 絶対実装しないといけない箇所なので例外エラーをつける
        let error_message = 'Canvas3D Class: No load method defined';

        alert(error_message);
        throw new Error(error_message);
    }

    /**
     * メモリやオブジェクトの解放
     */
    dispose() {
        // 絶対実装しないといけない箇所なので例外エラーをつける
        let error_message = 'Canvas3D Class: No dispose method defined';

        alert(error_message);
        throw new Error(error_message);
    }

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
    render(gl, time) {
        // 絶対実装しないといけない箇所なので例外エラーをつける
        let error_message = 'Canvas3D Class: No render method defined';

        alert(error_message);
        throw new Error(error_message);
    }

    /**
     * 描画後処理
     */
    afterRender(time) {}

    /**
     * マウス移動した場合に呼び出されるアクション
     * マウス座標は正規化デバイス座標系として引数から受け取れる
     */
    actionMoveMouse(xNDC, yNDC) {
    }
}