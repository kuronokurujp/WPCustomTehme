precision mediump float;

uniform float lightIntensity;
uniform sampler2D point_texture;
varying vec4 vColor;

void main() {
    // gl_PointCoordは頂点がポイントスプライトでないと利用出来ない
    // -1 - 1の範囲に変換
    vec2 ndc_st = gl_PointCoord.st * 2.0 - 1.0;

    vec4 point_texture = texture2D(point_texture, gl_PointCoord.st);

    float bias = lightIntensity / length(ndc_st);
    // 最大値を1.0にする
    gl_FragColor = vColor * point_texture * min(bias, 1.0);
}