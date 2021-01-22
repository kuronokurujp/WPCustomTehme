/**
 * WegGL画面のモデル
 */
class WebGLModel {
    constructor(js_root_file_path, canvas_names, data_container) {
        this.js_root_file_path = js_root_file_path;
        this.canvas_names = canvas_names;
        this.load_canvas_flag = false;
        this.canvas3D = null;
        this.canvas3D_scripts = [];
        this.load_canvas_name = '';
        this.data_container = data_container;
    }

    init() {
        // ベースCanvasのjsファイルをロード
        return new Promise((resolve) => {
            common_module.loadScript(this.js_root_file_path + '/js/webgl/canvas/canvas3D.js')
                .then((loadScript) => {
                    resolve();
                });
        });
    }

    /**
     * キャンバス名前リストからキャンバス名を取得
     * @param {*} index 
     */
    getCanvasNameFromCanvasNameList(index) {
        return this.canvas_names[index];
    }

    /**
     * 指定キャンバス名でロードされているか返す
     * @param {*} canvas_name 
     */
    isLoadCanvas(canvas_name) {
        return (this.load_canvas_name == canvas_name);
    }

    /**
     * 指定した名前のキャンバスをロード
     * @param {*} canvas_name 
     */
    loadCanvas3D(canvas_name) {
        this.load_canvas_name = canvas_name;

        return new Promise((resolve) => {

            // 指定したキャンバスをロードする
            const load_script_file_path = this.js_root_file_path + '/js/webgl/canvas/' + this.load_canvas_name + '/canvas3D.js';

            // クラス名を取得
            const className = this.load_canvas_name.slice(4);

            // すでにロード済みかチェック
            if (!this.canvas3D_scripts.includes(load_script_file_path)) {
                // ロードされていない場合はロードする
                var load_js_file_promise = new Promise((resolve) => {
                    common_module.loadScript(load_script_file_path)
                        .then((loadScript) => {
                            this.canvas3D_scripts.push(load_script_file_path);
                            resolve();
                        });
                });

                load_js_file_promise.then(() => {
                    var class_declaration = common_module.getClass(className);
                    this.canvas3D = new class_declaration(this.js_root_file_path + '/js/webgl/canvas/' + canvas_name, this.data_container);
                    resolve(this.canvas3D);
                });
            }
            else {
                var class_declaration = common_module.getClass(className);
                this.canvas3D = new class_declaration(this.js_root_file_path + '/js/webgl/canvas/' + canvas_name, this.data_container);
                resolve(this.canvas3D);
            }
        });
    }

    /**
     * モデルのキャンバスデータを破棄
     */
    releaseCanvas3D() {
        return new Promise((reslove) => {
            if (this.canvas3D != null)
                this.canvas3D.dispose();

            common_module.freeObject(this.canvas3D);
            this.canvas3D = null;

            this.data_container.release();

            reslove();
        });
    }
}
