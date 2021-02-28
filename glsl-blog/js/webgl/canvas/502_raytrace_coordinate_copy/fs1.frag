precision mediump float;

uniform float time;
uniform vec2 resolution;

const float ESP = 0.0001;
const float raduis = 0.5;

// １つの座標空間を一つの方眼紙としていくつもの座標空間をグリッド上に並べている
vec3 repetition(vec3 p, vec3 width) {
    return mod(p, width) - width * 0.5;
}

float map(vec3 p) {
    return length(repetition(p, vec3(3.0))) - raduis;
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
    vec3 dir = normalize(vec3(p, -0.5));

    // レイの原点
    vec3 origin = vec3(0.0, 0.0, 5.0 - time);
    vec3 ray = origin;

    float d = 0.0;
    // ループ回数が増えせば球と球の間の小さな隙間にレイが通るが
    // 回数が増えると負荷があがるので危険
    for (int i = 0; i < 32; ++i) {
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
        vec3 lightDir = vec3(1.0, 1.0, 0.0);
        float diffus = max(dot(n, lightDir), 0.1);
        color = vec3(diffus);
        color *= vec3(1.0, 1.0, 1.0);
    }

    gl_FragColor = vec4(color, 1.0);
}