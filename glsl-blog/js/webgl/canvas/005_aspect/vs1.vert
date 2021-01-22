
// 呼び出し元でバインドしてデータが転送されたが設定される
attribute vec3 position;
// 頂点属性の頂点カラー
attribute vec4 color;
// 頂点サイズ
attribute float pointSize;
// マウスの座標(正規化デバイス座標)
uniform vec2 mouse;
// 画面解像度
uniform vec2 resolution;
// ピクセルシェーダーに渡す値を設定
varying vec4 vColor;

void main() {
    vColor = color;

    // 縦の大きさに合わせた横のアスペクト比を作成
    float aspect = 1.0 / (resolution.x / resolution.y);
    vec3 p = position * vec3(aspect, 1.0, 1.0);

    // 描画する時の座標
    gl_Position = vec4(p + vec3(mouse, 0.0), 1.0);

    // 描画する時のサイズ
    gl_PointSize = pointSize;
}