precision mediump float;

uniform vec4 globalColor;
uniform sampler2D textureUnit01;
uniform sampler2D textureUnit02;
uniform float ratio;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    // それぞれのテクスチャからピクセルを取得してブレンドする
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);
    vec4 samplerColor02 = texture2D(textureUnit02, vTexCoord);

    // 頂点シェーダーから受け取った頂点色とユニーク色とテクスチャの色を合成して出力
    gl_FragColor = globalColor * vColor * mix(samplerColor01, samplerColor02, ratio);
}