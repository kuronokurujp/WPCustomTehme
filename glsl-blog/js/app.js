/** アプリ実行用 */

/**
 * DOMContentLoadedイベント時に初期化処理をする
 * HTMLの読み込みが完了した瞬間に呼ばれるイベント
 * ここ以外で初期化すると操作対象の要素がないなどバグになる
 */

// Controllerは外部参照するのでグローバルで定義
let g_webglControllerInstance = null;

window.addEventListener('DOMContentLoaded', () => {
    // WebGLの制御に必要ならファイルをロード
    Promise.all([
        common_module.loadScript(g_javascript_filepath + '/js/webgl_controller.js'),
        common_module.loadScript(g_javascript_filepath + '/js/webgl_model.js'),
        common_module.loadScript(g_javascript_filepath + '/js/webgl/libs/math.js'),
        common_module.loadScript(g_javascript_filepath + '/js/webgl/libs/frame.js'),
    ])
    .then(() => {
        const view = new WebGLFrame();
        const model = new WebGLModel(g_javascript_filepath);
        g_webglControllerInstance = new WebGLController(model, view, g_javascript_filepath);
        g_webglControllerInstance.init("js-webgl-canvas");
    });
});