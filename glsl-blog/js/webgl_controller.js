/**
 * WebGL画面の制御
 */

// 指定キャンバスを設定してWebGLを実行
class WebGLController {
    constructor(viewModel, mouseModel, view) {
        this.viewModel = viewModel;
        this.mouseModel = mouseModel;
        this.view = view;
        this.loading_show = false;
    }

    /**
     * 初期化
     */
    init(gl_context, canvas) {
        return new Promise((reslove) => {
            this.view.init(gl_context, canvas);

            this.viewModel.init()
                .then(() => {
                    // 初期画面を表示
                    var showAction = this.actionShow(this.viewModel.getCanvasNameFromCanvasNameList(0));
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
        if (this.viewModel.isLoadCanvas(canvasName)) {
            return null;
        }

        return new Promise((reslove) => {
            this.loading_show = true;

            this.view.disable();

            // キャンバスをViewから外す
            this.view.detachCanvas(this.viewModel.canvas3D).then(() => {
                // ロードしたキャンバスがあれば破棄する
                this.viewModel.releaseCanvas3D()
                    .then(() => {
                        // Viewにアタッチするキャンバスをロード生成
                        let promise = this.viewModel.loadCanvas3D(canvasName);
                        // ロードに失敗した
                        if (promise == null) {
                            this.loading_show = false;
                            return;
                        }

                        // ロードが成功したらWebGLでレンダリングする
                        promise.then((canvas) => {
                            this.view.attachCanvas(canvas)
                                .then(() => {
                                    // アニメーション更新を有効にする
                                    this.view.enable(true);
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

    /**
     * マウス移動イベントアクション
     */
    actionMouseMove(mouseMoveEventData) {
        // マウス移動によるモデル内のデータ更新
        this.mouseModel.move(mouseMoveEventData);
        // 更新されたモデルを使ってビューにマウス移動結果を伝達
        this.view.canvas3Ds.forEach((canvas3D) => {
            const mouseModel = this.mouseModel;
            // 正規化デバイス座標系になっているのマウス座標を渡す
            canvas3D.actionMoveMouse(mouseModel.mouseX, mouseModel.mouseY);
        });
    }
}
