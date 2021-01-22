precision mediump float;

uniform float time;
uniform vec2 resolution;

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec3 rgb = vec3(vec2((gl_FragCoord.st * 2.0 - resolution) / resolution), 0.0);
    gl_FragColor = vec4(rgb, 1.0);
}