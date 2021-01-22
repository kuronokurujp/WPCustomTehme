// ポストエフェクト用
// バリューノイズ
precision mediump float;

uniform vec2 resolution;
uniform sampler2D textureUnit01;
uniform sampler2D noiseTextureUnit02;
// ノイズ力
uniform float noiseStrength;
uniform float time;
uniform float timeScale;
uniform int noiseType;

// ノイズの可視化
uniform bool noiseViewFlag;
// 極座標を使うか
uniform bool polarCoordinateFlag;

varying vec2 vTexCoord;

const float PI = 3.14;

vec4 noiseColor_01() {
    vec2 coord;

    // 極座標からノイズUV値を計算
    if (polarCoordinateFlag == true) {
        // テクスチャ座標からスクリーンの中心を求める
        // 0 - 1 => -1.0 - 1.0
        vec2 originCenter = vTexCoord * 2.0 - 1.0;
        // 角度
        float s = (atan(originCenter.y, originCenter.x) + PI) / (PI * 2.0);
        // 距離
        float t = length(originCenter);

        coord = vec2(s, fract(t - time * timeScale));
    }
    // 直交座標からノイズUV値を計算
    else {
        // 引く側の値はどんどん多くなる
        // しかしfractして小数値のみ取得する事で
        // 最後は
        // -0.999.. から 0 の値をループする事になる
        coord = fract(vTexCoord - vec2(0.0, time * timeScale));
    }

    // ノイズテクスチャからノイズ値を取る
    vec4 noise = texture2D(noiseTextureUnit02, coord);

    // RGBAだから0 - 1の値になっている
    // しかしテクスチャをUVでずらすノイズ値としてはこれでは使えないので
    // 右上にしかノイズが掛からないから
    // 上下左右にノイズを掛けるには
    // -1 - 1の範囲値にしないといけないので変換している
    vec2 noiseUV = noise.rg * 2.0 - 1.0;
    noiseUV *= noiseStrength;

    vec4 color = texture2D(textureUnit01, vTexCoord + noiseUV);
    if (noiseViewFlag == true) {
        // ノイズ情報を可視化する場合は
        // ノイズカラーを加算している
        color += vec4(noise.rgb, 0.0);
    }

    return color;
}

vec4 noiseColor_02() {
    vec2 coord;
    // テクスチャ座標からスクリーンの中心を求める
    // 0 - 1 => -1.0 - 1.0
    vec2 originCenter = vTexCoord * 2.0 - 1.0;

    // 極座標からノイズUV値を計算
    if (polarCoordinateFlag == true) {
        // 角度
        // sを座標変換している 0.0 ~ 1.0に
        // atan(y, x) + PI => (0.0 ~ 2PI) / 2PI => 0.0 ~ 1.0
        float s = (atan(originCenter.y, originCenter.x) + PI) / (PI * 2.0);
        // 距離
        float t = 0.0;

        coord = vec2(s, fract(t - time * timeScale));
    }
    // 直交座標からノイズUV値を計算
    else {
        // 引く側の値はどんどん多くなる
        // しかしfractして小数値のみ取得する事で
        // 最後は
        // -0.999.. から 0 の値をループする事になる
        coord = fract(vTexCoord - vec2(0.0, time * timeScale));
    }

    // ノイズテクスチャからノイズ値を取る
    vec4 noiseColor = texture2D(noiseTextureUnit02, coord);

    // ノイズ値を正負の正規化した値にする
    float noise = noiseColor.r * 2.0 - 1.0;
    // ノイズ係数を与える
    noise *= noiseStrength;
    // さらにテクスチャ座標を中心として距離を与える
    noise *= length(originCenter);

    // テクスチャ座標の中心から離れている程ゆがみが強くなる
    vec4 color = texture2D(textureUnit01, vTexCoord + originCenter * noise);
    if (noiseViewFlag == true) {
        // ノイズ情報を可視化する場合は
        // ノイズカラーを加算している
        color += vec4(noiseColor.rgb, 0.0);
    }

    return color;
}

void main() {

    if (noiseType == 0) {
        gl_FragColor = noiseColor_01();
    }
    else if (noiseType == 1) {
        gl_FragColor = noiseColor_02();
    }
}