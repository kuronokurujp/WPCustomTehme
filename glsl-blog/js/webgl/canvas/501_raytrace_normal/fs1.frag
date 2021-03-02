precision mediump float;

uniform float time;
uniform vec2 resolution;

const float ESP = 0.0001;
const float raduis = 1.0;

float map(vec3 p) {
    return length(p) - raduis;
}

vec3 normal(vec3 p) {
    return normalize(vec3(
        map(p + vec3(ESP, 0.0, 0.0)) - map(p + (-ESP, 0.0, 0.0)),
        map(p + vec3(0.0, ESP, 0.0)) - map(p + (0.0, -ESP, 0.0)),
        map(p + vec3(0.0, 0.0, ESP)) - map(p + (0.0, 0.0, -ESP))
    ));
}

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);
    // 画面の画素方向にレイを飛ばしている
    vec3 dir = normalize(vec3(p, -2.0));

    // レイの原点
    vec3 origin = vec3(0.0, 0.0, 5.0);
    vec3 ray = origin;

    float d = 0.0;
    for (int i = 0; i < 8; ++i) {
        d = map(ray);
        // レイとオブジェクトがぶつかったら終了
        if (d < ESP) {
            break;
        }

        // レイを方向に沿って進めている
        ray += dir * d;
    }

    vec3 color = vec3(0.0);
    if (d < ESP) {
        vec3 n = normal(ray);
        vec3 lightDir = vec3(-1.0, -1.0, 0.0);
        float power = 2.0;
        float diffus = max(dot(n, lightDir), 0.1) * power;
        color = vec3(diffus);
        color *= vec3(1.0, 0.0, 0.0);
    }

    gl_FragColor = vec4(color, 1.0);
}