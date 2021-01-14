/**
 * WegGL画面のモデル
 */

// TODO: ロードするキャンバスリストを定義して、読み込むなどをするかも
class WebGLModel {
    constructor(js_filepath) {
        this.readyFlag = false;
        this.canvas = null;
        this.context = null;
        this.js_filepath = js_filepath;
    }

    init(canvasID) {
        this.canvas = document.getElementById(canvasID);
        // memo:
        // どうも2dコンテキストを使うとwebglのサポートができなくなるようだ
        // つまり一つのコンテキストしか使えないということになる
        //this.context = this.canvas.getContext('2d');
        /*
        // 挙動テスト: canvas色が変わるかどうか
        this.context.fillStyle = "blue";
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        */

        // ベースCanvasのjsファイルをロード
        return new Promise((resolve) => {
            common_module.loadScript(this.js_filepath + '/js/webgl/canvas/canvas3D.js')
            .then(() => {
                this.readyFlag = true;
                resolve();
            });
        });
    }

    loadCanvas3D() {
        if (!this.readyFlag)
            return null;

        // TODO: 指定したキャンバスをロードする
        // TODO: 古いキャンバスは破棄する

        return new Promise((resolve) => {
            resolve(new Canvas3D(this.js_filepath + '/js/webgl/canvas/basic'));
        });
    }
}
