
// 呼び出し元でバインドしてデータが転送されたが設定される
attribute vec3 position;

void main() {
    // 頂点変換

    // 描画する時の座標
    gl_Position = vec4(position, 1.0);

    // 描画する時のサイズ
    gl_PointSize = 16.0;
}