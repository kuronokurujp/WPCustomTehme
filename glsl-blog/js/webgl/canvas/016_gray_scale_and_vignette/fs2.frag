// ポストエフェクト用
precision mediump float;

uniform sampler2D textureUnit01;
// グレースケールの飽和値
uniform float graySaturation;
// ヴィネットの係数
uniform float vignetteValue;

varying vec2 vTexCoord;

void main() {
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);

    // グレースケール
    // 1. RGBのそれぞれの値の合計値を取得
    //    vec3(1.0)との内積計算で合計値を出せる
    //    dot(vec3(1.0), a) = a.r * 1 + a.b * 1 + a.g * 1
    //float rgbSumValue = dot(vec3(1.0), samplerColor01.rgb);
    //    単純にr + g + bの計算でもOK
    float rgbSumValue = samplerColor01.r + samplerColor01.g + samplerColor01.b;
    // 2. RGBのそれぞれの３つ足した値の平均値を出す
    float avgRGBValue = rgbSumValue / 3.0;
    // 3. 通常用とグレースケール用でmix
    vec3 rgb = mix(samplerColor01.rgb, vec3(avgRGBValue), graySaturation);

    // ヴィネット
    // 1. Tex平面の中心を原点(0, 0)の式を求める
    //    中心位置(0.5, 0.5) を(0, 0)に変換する計算
    vec2 v = vTexCoord * 2.0 - 1.0;
    // 2. ヴィネットの係数をTex平面中心とTex座標の距離で引く
    //    length(v)の最大√2, 最小0
    //    画面中心近い程明るくなる
    float vig = vignetteValue - length(v);

    // ヴィネット計算した値で掛け算するとrgbの値が1を超える
    // 1を超えた事で明るくなる
    gl_FragColor = vec4(rgb * vec3(vig), 1);
}