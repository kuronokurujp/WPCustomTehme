precision mediump float;

uniform vec4 globalColor;
uniform sampler2D textureUnit;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    // ピクセル色指定
    vec4 samplerColor = texture2D(textureUnit, vTexCoord);
    // 頂点シェーダーが渡された色を乗算
    gl_FragColor = globalColor * vColor * samplerColor;
}