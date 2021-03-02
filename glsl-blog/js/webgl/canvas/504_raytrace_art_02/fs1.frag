precision mediump float;

uniform float time;
uniform vec2 resolution;

const float ESP = 0.0001;
const float raduis = 0.5;

mat2 rot(float r) {
    return mat2(cos(r), sin(r), -sin(r), cos(r));
}

float cylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h,r);
    return min(max(d.x,d.y), 0.) + length(max(d, 0.));
}

float mainDist(vec3 p) {
    p.y += .1*sin(p.z*5.+time);
    p.xy *= rot(p.z*0.3);
    p.z += -time;
    p = mod(p, 0.4) - 0.25;
    return cylinder(p.xzy, .0, .04);
}

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);
    // 画面の画素方向にレイを飛ばしている

    // レイの原点
    vec3 ro = vec3(0., 0., 0.);
    vec3 rd = normalize(vec3(p, -1.0));

    float d, t = 0.;
    float particleEmissive = 0.;
    // ループ回数が増えせば球と球の間の小さな隙間にレイが通るが
    // 回数が増えると負荷があがるので危険
    for (int i = 0; i < 76; ++i) {
        d = mainDist(ro + rd * t);
        // レイとオブジェクトがぶつかったら終了
        if (d < ESP) break;

        particleEmissive += .03/abs(d);
        t += d;
    }

    vec3 col = .1*particleEmissive*vec3(.3,.3,.7);
    gl_FragColor = vec4(col, 1.0);
}