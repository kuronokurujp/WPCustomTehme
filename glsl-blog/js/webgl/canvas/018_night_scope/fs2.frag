// ポストエフェクト用
// ナイトスコープ
precision mediump float;

uniform vec2 resolution;
uniform sampler2D textureUnit01;
// 画面色
uniform vec3 screenColor;
// ノイズ力
uniform float noiseStrength;
// ヴィネットの彩度
uniform float saturation;
// 走査線の周期調整
uniform float sinWave;
// 走査線の強さ
uniform float waveStrength;

uniform float time;

varying vec2 vTexCoord;

// 乱数生成1
float rnd(vec2 value) {
    return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);

    // グレースケール
    float rgbSumValue = samplerColor01.r + samplerColor01.g + samplerColor01.b;
    float avgRGBValue = rgbSumValue / 3.0;
    float gray = avgRGBValue;

    // ヴィネット
    vec2 texVec = vTexCoord * 2.0 - 1.0;
    float vig = saturation - length(texVec);

    // 走査線
    float wave = sin(texVec.y * sinWave + time);
    // -1 - 1 => 0 - 2 => 0 - 1
    wave = (wave + 1.0) * 0.5;
    wave = 1.0 - (wave * waveStrength);

    // ホワイトノイズ
    // 乱数でグレースケール化した色に乗算する値を求める
    // 乱数生成
    // 乱数になっていればどのような乱数生成器でも良い
    // gl_FragCoordは処理するピクセルの座標(左下原点の画面解像度, 正規化デバイス座標ではないので注意)
    float noise = rnd(gl_FragCoord.st + time * 0.01);
    // 色と乗算する値を求める
    // 係数が0の場合にn=1にするために反転
    // n=1はノイズが掛かっていない状態にするため
    noise = 1.0 - noise * noiseStrength;

    // グレースケール, ヴィネット, ホワイトノイズ, 走査線
    gl_FragColor = vec4(vec3(screenColor * gray * noise * vig * wave), 1);
}