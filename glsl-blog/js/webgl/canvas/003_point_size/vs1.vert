
// 呼び出し元でバインドしてデータが転送されたが設定される
attribute vec3 position;
// 頂点属性の頂点カラー
attribute vec4 color;
// 頂点サイズ
attribute float pointSize;
// ピクセルシェーダーに渡す値を設定
varying vec4 vColor;

void main() {
    vColor = color;

    // 描画する時の座標
    gl_Position = vec4(position, 1.0);

    // 描画する時のサイズ
    gl_PointSize = pointSize;
}