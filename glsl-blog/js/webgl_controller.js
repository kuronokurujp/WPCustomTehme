/**
 * WebGL画面の制御
 */

 // TODO: 指定キャンバスを設定してWebGLを実行
class WebGLController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    init(canvasID) {
        this.model.init(canvasID)
        .then(() => {
            console.log('ctrl: init');
            this.view.init(this.model.canvas);

            this.show();
        });
    }

    show() {
        // TODO: canvasにwegglの描画更新をする
        let promise = this.model.loadCanvas3D();
        // モデルの利用出来ないとnullになる
        if (promise == null)
            return;

        promise.then((canvas) => {
            this.view.load(canvas)
            .then(() => {
                this.view.setup();
                this.view.update();
                this.view.render();
            });
        });
    }
}
