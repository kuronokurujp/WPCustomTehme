attribute vec3 position;
attribute vec2 texCoord;

uniform sampler2D dataTextureUnit;

void main() {
    vec3 p = position;
    // テクスチャーに書き込まれたテクセルを座標オフセットとして扱う
    p += texture2D(dataTextureUnit, texCoord).rgb;

    gl_Position = vec4(p, 1.0);
    // 点描画の場合はSize指定しないと画面で見えない(初期値が0なのだろう)
    gl_PointSize = 16.0;
}