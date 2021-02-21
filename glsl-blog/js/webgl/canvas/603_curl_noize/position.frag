precision mediump float;

// TODO: 前フレームのデータテクスチャが必要
uniform sampler2D prevDataTextureUnit;
uniform vec2 resolution;

void main() {
    vec2 coord = gl_FragCoord.st / resolution;
    vec4 prevPos = texture2D(prevDataTextureUnit, coord);

    gl_FragColor = prevPos + vec4(0.001, 0.0, 0.0, 0.0);
}