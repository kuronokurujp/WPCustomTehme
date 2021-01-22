/**
 * アプリモデルデータ
 * プラウザページデータをjs側に渡すための架け橋となるモデル
 * プラウザページ側のデータを設定してjs側が参照する
 */
class AppModel {
    constructor(js_root_path) {
        this.js_root_path = js_root_path;
        this.canvas_names = [];
    }

    addCanvasName(canvas_name) {
        this.canvas_names.push(canvas_name);
    }
}