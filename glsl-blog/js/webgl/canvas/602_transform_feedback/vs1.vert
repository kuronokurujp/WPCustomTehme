attribute vec3 position;
attribute vec3 velocity;

uniform mat4 mvpMatrix;

varying vec3 vColor;

void main() {
    vec3 p = position;
    gl_Position = mvpMatrix * vec4(p, 1.0);

    vColor = p;

    gl_PointSize = 2.0;
}
