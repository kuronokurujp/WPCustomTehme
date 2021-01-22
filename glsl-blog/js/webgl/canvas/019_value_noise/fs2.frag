// ポストエフェクト用
// バリューノイズ
precision mediump float;

uniform vec2 resolution;
uniform sampler2D textureUnit01;
// ノイズ力
uniform float noiseStrength;
uniform float time;

varying vec2 vTexCoord;

const int OCT = 8;
const float PST = 0.5;
const float PI = 3.1415926;

// 線形補間
float interpolate(float a, float b, float x) {
    // 0 から 1の補間した値を取得
    float f = (1.0 - cos(x * PI)) * 0.5;
    // 線形補間の式は
    // a(1 - f) + bf
    // f = 0ならa
    // f = 1ならb
    // fの式に三角関数を使用しているのは補間する値の連続性をなだらかにするため
    return a * (1.0 - f) + b * f;
}

// 乱数生成器
float rnd(vec2 n) {
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt = dot(n, vec2(a, b));
    float sn = mod(dt, PI);
    return fract(sin(sn) * c);
}

// 4つの乱数を作り、それらの値を補間した値を返す
// 4つの乱数がシャッフルされる
// ２つの値が必要
float irnd(vec2 p) {
    // 整数のみ取り出す
    vec2 i = floor(p);
    // 小数のみ取り出す
    vec2 f = fract(p);
    // 引数の2つの値を元にした4つの乱数を作成
    vec4 v = vec4(
        // xyが1.0ずつずらした4パターンの乱数を作成
        rnd(vec2(i.x, i.y)),
        rnd(vec2(i.x + 1.0, i.y)),
        rnd(vec2(i.x, i.y + 1.0)),
        rnd(vec2(i.x + 1.0, i.y + 1.0)));

    // ４つの乱数を２つのペアにして補間する
    return interpolate(interpolate(v.x, v.y, f.x), interpolate(v.z, v.w, f.x), f.y);
}

float noise(vec2 p) {
    float t = 0.0;
    for (int i = 0; i < OCT; ++i) {
        // freqは2の2乗の値になる
        // 0 => 0, 1 => 1, 2 => 4, 3 => 8
        float freq = pow(2.0, float(i));
        // PST(0.5)を累乗している
        // OCT(8)とすると以下の数で累乗している
        // 8, 7, 6, 5, 4, 3, 2, 1, 0
        // 累乗の数が大きくなる程ampの値は小さくなる
        float amp = pow(PST, float(OCT - i));

        t += irnd(vec2(p.x / freq, p.y / freq)) * amp;
    }

    return t;
}

float snoise(vec2 p, vec2 q, vec2 r) {
    float n = 0.0; 
    // テクスチャ座標値からノイズに与える係数を作成している
    // グラフ上で見ると値の並びは曲線になる
    float ld = q.x * q.y;
    float lu = q.x * (1.0 - q.y);
    float rd = (1.0 - q.x) * q.y;
    float ru = (1.0 - q.x) * (1.0 - q.y);

    // それぞれのノイズに係数を与えた後に加算する
    // この係数はなくても問題ない
    // しかしノイズ表現を際立たせるために追加している
    n += noise(vec2(p.x, p.y)) * ld;
    n += noise(vec2(p.x, p.y + r.y)) * lu;
    n += noise(vec2(p.x + r.x, p.y)) * rd;
    n += noise(vec2(p.x + r.x, p.y + r.y)) * ru;

    return n;
}

void main() {
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);

    // グレースケール
    float rgbSumValue = samplerColor01.r + samplerColor01.g + samplerColor01.b;
    float gray = rgbSumValue / 3.0;

    // バリューノイズを取得
    float noise = snoise(gl_FragCoord.st + time * 20.0, vTexCoord, resolution);
    noise = 1.0 - noise * noiseStrength;

    gl_FragColor = vec4(vec3(gray) * noise, 1);
}