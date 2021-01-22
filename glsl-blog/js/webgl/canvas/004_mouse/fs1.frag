precision mediump float;

uniform vec4 globalColor;
// varying変数で頂点カラーをピクセルシェーダーで受け取る
varying vec4 vColor;

void main() {
    // ピクセル色指定
    // 頂点シェーダーが渡された色を乗算
    gl_FragColor = globalColor * vColor;
}