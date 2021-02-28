precision mediump float;

uniform vec3 globalColor;

varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    gl_FragColor = vec4(globalColor, 1.0) * vColor;
}