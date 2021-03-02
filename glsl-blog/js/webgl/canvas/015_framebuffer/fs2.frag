// ポストエフェクト用
precision mediump float;

uniform sampler2D textureUnit01;
// 画面全体の明るさ係数
uniform float brigthness;
varying vec2 vTexCoord;

void main() {
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);
    // アルファは常に1
    // RGBのみ変える
    // brigtness値について
    // 1 => 暗く
    // 0 => 明るく
    // そのままの値を使用すると
    // 1 => 明るく
    // 0 => 暗く
    // となるので反転させて1.0を0.0に0.0を1.0にした
    // これは最小が0.0 / 最大が1.0と理解しているから
    gl_FragColor = samplerColor01 * vec4(vec3(1.0 - brigthness), 1.0);
}