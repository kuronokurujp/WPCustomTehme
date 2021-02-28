precision mediump float;

uniform vec4 globalColor;
uniform sampler2D textureUnit01;
uniform sampler2D textureUnit02;
uniform sampler2D textureUnit03;
uniform float ratio;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    // それぞれのテクスチャからピクセルを取得してブレンドする
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);
    vec4 samplerColor02 = texture2D(textureUnit02, vTexCoord);
    // 横にずらすと横にラインが走った絵に変わる
    //vec4 samplerColor03 = texture2D(textureUnit03, vec2(vTexCoord.x + 1.0, vTexCoord.y));
    // 縦にずらうと縦にラインが走った絵に変わる
    //vec4 samplerColor03 = texture2D(textureUnit03, vec2(vTexCoord.x, vTexCoord.y + 1.0));
    vec4 samplerColor03 = texture2D(textureUnit03, vTexCoord);

    // 0 - 1の範囲に収める
    // ratio (0 - 1) * 2となるので(0 - 2)となる
    // テクスチャの色は(0 - 1)なので
    // 0 から 2の範囲の値になる1を超えた場合は1に収める
    float transition = clamp(ratio * 2.0 - samplerColor03.b, 0.0, 1.0);

    // 頂点シェーダーから受け取った頂点色とユニーク色とテクスチャの色を合成して出力
    gl_FragColor = globalColor * vColor * mix(samplerColor01, samplerColor02, transition);
}