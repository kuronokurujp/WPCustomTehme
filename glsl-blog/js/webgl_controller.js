/**
 * WebGL画面の制御
 */

// 指定キャンバスを設定してWebGLを実行
class WebGLController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.loading_show = false;
    }

    /**
     * 初期化
     */
    init(gl_context, canvas) {
        return new Promise((reslove) => {
            this.view.init(gl_context, canvas);

            this.model.init()
                .then(() => {
                    // 初期画面を表示
                    var showAction = this.actionShow(this.model.getCanvasNameFromCanvasNameList(0));
                    if (showAction != null) {
                        showAction
                            .then(() => {
                                reslove();
                            });
                    }
                    else {
                        reslove();
                    }
                });
        });
    }

    /**
     * 描画実行
     */
    actionShow(canvasName) {
        if (this.loading_show) {
            return null;
        }

        // ロード指定したのがすでにロードされているかチェックしてロードしているなら何もしない
        if (this.model.isLoadCanvas(canvasName)) {
            return null;
        }

        return new Promise((reslove) => {
            this.loading_show = true;

            this.view.disable();

            // キャンバスをViewから外す
            this.view.detachCanvas(this.model.canvas3D).then(() => {
                // ロードしたキャンバスがあれば破棄する
                this.model.releaseCanvas3D()
                    .then(() => {
                        // Viewにアタッチするキャンバスをロード生成
                        let promise = this.model.loadCanvas3D(canvasName);
                        // ロードに失敗した
                        if (promise == null) {
                            this.loading_show = false;
                            return;
                        }

                        // ロードが成功したらWebGLでレンダリングする
                        promise.then((canvas) => {
                            this.view.attachCanvas(canvas)
                                .then(() => {
                                    this.view.enable(false);
                                    this.view.update();
                                    this.view.render();

                                    this.loading_show = false;

                                    reslove();
                                });
                        });
                    });
            });
        });
    }
}
