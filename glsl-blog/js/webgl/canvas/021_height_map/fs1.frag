precision mediump float;

uniform sampler2D imageTexture;
uniform sampler2D higtMapTexture;
uniform vec2 mouse;
uniform float mouseScale;
varying vec2 vTexCoord;

void main() {
    vec4 higtMapTextureSample01 = texture2D(higtMapTexture, vTexCoord);
    // この値によって奥行きがずれが変わる
    float focus = 0.5;
    float height = higtMapTextureSample01.r - focus;
    // -mouseとする事でマウス移動方向に画像をずらす事ができる
    vec2 offset = -mouse * mouseScale * height;

    // テクスチャオフセット量が0.05を超えると色を取得する領域外になっておかしな色が取得される
    // テクスチャの色を取得する位置をずらしている
    vec4 samplerColor01 = texture2D(imageTexture, vTexCoord + offset);
    gl_FragColor = samplerColor01;
}