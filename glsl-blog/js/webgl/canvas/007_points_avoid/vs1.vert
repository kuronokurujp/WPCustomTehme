
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
// 時間
uniform float time;
// ピクセルシェーダーに渡す値を設定
varying vec4 vColor;

void main() {
    vColor = color;

    // 縦の大きさに合わせた横のアスペクト比を作成
    float aspect = 1.0 / (resolution.x / resolution.y);
    vec3 a = vec3(aspect, 1.0, 1.0);
    vec3 p = position * a;

    // マウス座標は画面比の正規化デバイス座標系の座標
    vec3 m = vec3(mouse, 0.0);

    vec3 v = p - m;
    // アスペクト比に合わせる
    vec3 n = normalize(v) * a;

    // 元の縦横比にした長さを求める
    float l = length(v / a);

    // 0.0 - 0.5 から 1.0 - 0.5 に変換
    // マウス位置周辺の点が大きくなる
    // マウスから離れ程点は小さくなる
//    l = 1.0 - smoothstep(0.0, 0.5, l);

    // マウス位置周辺の点が小さくなる
    // マウスから離れる程点は大きくなる
    l = smoothstep(0.0, 0.5, l);

    // 描画する時の座標
    gl_Position = vec4(p + n * l * 0.1, 1.0);

    // 描画する時のサイズ
    // 浮動小数点を扱う関数ならリテラルは小数点を付けて浮動小数点の型にしないとエラーになる
    gl_PointSize = pointSize * l * 2.0;
}