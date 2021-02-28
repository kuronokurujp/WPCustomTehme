precision mediump float;

uniform vec4 globalColor;
varying vec4 vColor;

void main() {
    // ピクセル色指定
    // 頂点シェーダーが渡された色を乗算
    gl_FragColor = globalColor * vColor;
}