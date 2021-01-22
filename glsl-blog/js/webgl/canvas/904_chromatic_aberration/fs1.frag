precision mediump float;

uniform float time;
uniform vec2 resolution;

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);

    float d = length(p) * 0.05;

    float rx = p.x * (1.0 + d);
    float gx = p.x;
    float bx = p.x * (1.0 - d);

    float r = 0.05 / abs(p.y + sin(rx + time));
    float g = 0.05 / abs(p.y + sin(gx + time));
    float b = 0.05 / abs(p.y + sin(bx + time));

    gl_FragColor = vec4(vec3(r, g, b), 1.0);
}