precision mediump float;

uniform vec4 globalColor;
uniform sampler2D textureUnit01;
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    vec4 samplerColor01 = texture2D(textureUnit01, vTexCoord);
    gl_FragColor = globalColor * vColor * samplerColor01;
}