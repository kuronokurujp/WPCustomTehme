/** アプリ実行用 */

/**
 * DOMContentLoadedイベント時に初期化処理をする
 * HTMLの読み込みが完了した瞬間に呼ばれるイベント
 * ここ以外で初期化すると操作対象の要素がないなどバグになる
 */

window.addEventListener('DOMContentLoaded', () => {
    // MEMO: ローディング表示がほしいかも

    let webgl_controller_instance = null;

    // WebGLの制御に必要なjsファイルをロード
    Promise.all([
        common_module.loadScript(g_app_model.js_root_path + '/js/webgl_controller.js'),
        common_module.loadScript(g_app_model.js_root_path + '/js/webgl_model.js'),
        common_module.loadScript(g_app_model.js_root_path + '/js/webgl/libs/math.js'),
        common_module.loadScript(g_app_model.js_root_path + '/js/webgl/libs/frame.js'),
        common_module.loadScript(g_app_model.js_root_path + '/js/webgl/libs/camera_controller.js'),
    ]).then((loadScripts) => {
        const container = new WebGLDataContainer('js-webgl-canvas');
        const view = new WebGLView();
        const viewModel = WebGLModel.createViewModel(g_app_model.js_root_path, g_app_model.canvas_names, container);
        const mouseModel = WebGLModel.createMouseModel(container.canvas);
        webgl_controller_instance = new WebGLController(viewModel, mouseModel, view);
        webgl_controller_instance.init(container.gl_context, container.canvas)
            .then(() => {
                // js-canvas-thumbnail-imgのID要素が複数ある。
                // 複数ある要素それぞれにクリックイベント付与した
                const canvas_thumbnail_imgs = document.querySelectorAll('#js-canvas-thumbnail-img');
                canvas_thumbnail_imgs.forEach(element => {
                    element.addEventListener('click', (event) => {
                        // canvas名を取得してWebGLの描画を切り替える
                        const value_match = element.outerHTML.match(/^.+(value="\w+").+$/);
                        if (value_match != null) {
                            // 文字列に"がついているので削除
                            const canvas_name = value_match[1].replace('value=', '').replace(/"/g, '');
                            webgl_controller_instance.actionShow(canvas_name);
                        }
                    }, false);
                });

                // view_buttonのクリックイベント
                const back_view_on_button = document.getElementById('js_back_on_view_button');
                const back_view_off_button = document.getElementById('js_back_off_view_button');
                const dairy_views = document.getElementsByClassName('js_dairy_view');

                let view_flag = false;
                if (back_view_on_button != null) {
                    back_view_on_button.onclick = function () {
                        view_flag = true;
                        for (let i = 0; i < dairy_views.length; ++i) {
                            dairy_views[i].style.display = 'none';
                        }
                    };
                }
                else {
                    throw new Error('back on view button element dont have');
                }

                if (back_view_off_button != null) {
                    back_view_off_button.onclick = function () {
                        view_flag = false;
                        for (let i = 0; i < dairy_views.length; ++i) {
                            dairy_views[i].style.display = 'block';
                        }
                    };
                }
                else {
                    throw new Error('back off view button element dont have');
                }

                // マウス移動イベント登録(シェーダーにマウス座標を渡すケースに対応)
                container.canvas.addEventListener('mousemove', (evt) => {
                    webgl_controller_instance.actionMouseMove(evt);
                });
            });
    });
});