// ポストエフェクト用
// ホワイトノイズ
precision mediump float;

uniform vec2 resolution;
uniform sampler2D textureUnit01;
// ランダムタイプ
uniform bool randomType;
// ノイズ力
uniform float noiseStrength;

uniform float time;

varying vec2 vTexCoord;

// 乱数生成1
float rnd(vec2 value) {
    return fract(sin(dot(value, vec2(12.9898, 78.233))) * 43758.5453);
}

// 乱数生成2
// 最大0.9999... / 最小-0.9999...
float rnd2(vec2 value) {
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt = dot(value, vec2(a, b));
    float sn = mod(dt, 3.14);
    return fract(sin(sn) * c);
}

void main() {
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);

    // ホワイトノイズ
    // 色はまずグレースケールにする
    // グレースケール
    // 1. RGBのそれぞれの値の合計値を取得
    //    vec3(1.0)との内積計算で合計値を出せる
    //    dot(vec3(1.0), a) = a.r * 1 + a.b * 1 + a.g * 1
    //float rgbSumValue = dot(vec3(1.0), samplerColor01.rgb);
    //    単純にr + g + bの計算でもOK
    float rgbSumValue = samplerColor01.r + samplerColor01.g + samplerColor01.b;
    // 2. RGBのそれぞれの３つ足した値の平均値を出す
    float avgRGBValue = rgbSumValue / 3.0;
    // 3. 通常用とグレースケール用のRGBに変換
    vec3 rgb = vec3(avgRGBValue);

    // 乱数でグレースケール化した色に乗算する値を求める
    // 乱数生成
    // 乱数になっていればどのような乱数生成器でも良い
    // gl_FragCoordは処理するピクセルの座標(左下原点の画面解像度, 正規化デバイス座標ではないので注意)
    float n = rnd(gl_FragCoord.st + time * 0.01);
    if (randomType == true) {
        n = rnd2(gl_FragCoord.st + time * 0.01);
    }
    // 色と乗算する値を求める
    // 係数が0の場合にn=1にするために反転
    // n=1はノイズが掛かっていない状態にするため
    n = 1.0 - n * noiseStrength;
    // 係数が0になると乗算値が0になり黒色になった
    // n = n * noiseStrength;

    gl_FragColor = vec4(rgb * n, 1);
}