attribute vec3 position;
attribute vec3 velocity;
attribute float random;

uniform vec2 mouse;
uniform float time;

// TransformFeedbackで計算した値を別シェーダーに渡す時は計算したいでは精度が悪くなるケースがあった
// 0.0 - 頂点座標の計算したら目的位置と元の位置に交互に移動した
varying vec3 vPosition;
varying vec3 vVelocity;

void main() {
    vPosition = position + velocity * 0.1;

    // マウスカーソルと頂点座標への速度を取得
    vec3 v = vec3(mouse + random, sin(time)) - position;
    vVelocity = normalize(velocity + v * 0.1);
}