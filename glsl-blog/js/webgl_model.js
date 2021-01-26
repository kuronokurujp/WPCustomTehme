/**
 * クラス名がバッティングしないようにnamespaceを取り入れてみた
 * 以下のサイトを参考にした
 * https://stackoverflow.com/questions/881515/how-do-i-declare-a-namespace-in-javascript
 */
let WebGLModel = {
    createMouseModel: function (canvas) {
        /**
         * モデルで利用するマウスオブジェクト
         */
        class Mouse {
            constructor(canvas) {
                this.mouseX = 0;
                this.mouseY = 0;
                this.canvas = canvas;
            }

            dispose() {
                this.canvas = null;
            }

            /**
             * マウス移動
             */
            move(mouseEvent) {
                // マウスの座標XY
                let x = mouseEvent.clientX;
                let y = mouseEvent.clientY;

                const width = this.canvas.width;
                const height = this.canvas.height;

                // 正規化デバイス座標系に変換
                // サイトで図付きで説明して分かりやすい
                // https://sbfl.net/blog/2016/09/05/webgl2-tutorial-3d-knowledge/#:~:text=%E6%AD%A3%E8%A6%8F%E5%8C%96%E3%83%87%E3%83%90%E3%82%A4%E3%82%B9%E5%BA%A7%E6%A8%99%EF%BC%88Normalized%20Device%20Coordinates%2C%20NDC%EF%BC%89&text=%E6%AD%A3%E8%A6%8F%E5%8C%96%E3%83%87%E3%83%90%E3%82%A4%E3%82%B9%E5%BA%A7%E6%A8%99%E3%81%AF,%E3%82%92%E6%8E%A1%E7%94%A8%E3%81%97%E3%81%A6%E3%81%84%E3%81%BE%E3%81%99%E3%80%82 

                // 一つ一つ計算を分解して座標変換する
                // わかりやすさ重視
                // ①スクリーン画面を画面半分左上にずらす
                // この計算で画面の左上が(-w/2, -h/2), 真ん中が(0, 0),右下が(w/2, h/2)を基準にした座標変換
                const sliceX = x - (width / 2);
                const sliceY = y - (height / 2);

                // ②画面半分の値で割る
                // この計算で画面の左上が(-1, -1), 真ん中が(0, 0),右下が(1, 1)を基準にした座標変換
                const divX = sliceX / (width / 2);
                const divY = sliceY / (height / 2);

                // ③x座標に*1, y座標に-1にする
                // この計算で画面の左上が(-1, 1), 真ん中が(0, 0),右下が(1, -1)を基準にした座標変換
                this.mouseX = divX * 1;
                this.mouseY = divY * -1;
            }
        }

        return new Mouse(canvas);
    },

    /**
     * モデル生成
     */
    createViewModel: function (js_root_path, canvas_names, container) {
        /**
         * WegGL画面のモデル
         */
        class Model {
            constructor(js_root_file_path, canvas_names, data_container) {
                this.js_root_file_path = js_root_file_path;
                this.canvas_names = canvas_names;
                this.load_canvas_flag = false;
                this.canvas3D = null;
                this.canvas3D_scripts = [];
                this.load_canvas_name = '';
                this.data_container = data_container;
            }

            dispose() {
                this.canvas3D = null;

                common_module.freeObject(this.canvas3D_scripts);
                this.canvas3D_scripts = null;

                this.data_container = null;
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
             */
            getCanvasNameFromCanvasNameList(index) {
                return this.canvas_names[index];
            }

            /**
             * 指定キャンバス名でロードされているか返す
             */
            isLoadCanvas(canvas_name) {
                return (this.load_canvas_name == canvas_name);
            }

            /**
             * 指定した名前のキャンバスをロード
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

        return new Model(js_root_path, canvas_names, container);
    }
};