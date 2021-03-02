precision mediump float;

uniform float time;
uniform vec2 resolution;

const float ESP = 0.0001;

float map(vec3 p, vec3 sphere_pos, float radius) {
    // この計算は球限定、平面や箱は全く違う
    return length(sphere_pos - p) - radius;
}

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);
    // 画面の画素方向にレイを飛ばしている
    // zの値でカメラの画角が変わる(撮影する範囲が変わる)
    // 小さい程画角が広くなる、
    // レイの伸びる範囲が広くなるから
    vec3 dir = normalize(vec3(p, -1.0));

    // レイの原点
    vec3 origin = vec3(0.0, 0.0, 5.0);
    vec3 ray = origin;

    float d = 0.0;
    for (int i = 0; i < 8; ++i) {
        // 球オブジェクトの距離を図り、その距離を返す
        d = map(ray, vec3(0.0, 2.0, 0.0), 1.0);
        // レイとオブジェクトがぶつかったら終了
        if (d < ESP) {
            break;
        }

        // レイを方向に沿って進めている
        ray += dir * d;
    }

    vec3 color = vec3(0.0);
    if (d < ESP) {
        color = vec3(1.0);
    }

    gl_FragColor = vec4(color, 1.0);
}