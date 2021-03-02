attribute vec2 texCoord;

uniform sampler2D positionTextureUnit;
uniform sampler2D velocityTextureUnit;
uniform mat4 mvp_mat;

varying vec4 vColor;

void main() {
    // テクスチャーに書き込まれたテクセルを座標オフセットとして扱う
    vec4 p = texture2D(positionTextureUnit, texCoord);
    vec4 v = texture2D(velocityTextureUnit, texCoord);

    // 頂点の色は進行方向の影響を受けるようにする
    vColor.rgb = (v.xyz + 1.0) * 0.5;
    // 原点からの距離に応じてアルファが変化するように
    vColor.a = 1.0 - smoothstep(1.0, 2.0, length(p.xyz));

    vec4 clip_pos = mvp_mat * vec4(p.xyz, 1.0);
    gl_Position = clip_pos;
    // 点描画の場合はSize指定しないと画面で見えない(初期値が0なのだろう)
    // ポイントサイズは座標用テクスチャの W 要素の影響を受けるようにする
    // これによりマウスボタンを離すとポイントサイズが小さくなる
    gl_PointSize = 1.0 * max(p.w, 0.5);
}