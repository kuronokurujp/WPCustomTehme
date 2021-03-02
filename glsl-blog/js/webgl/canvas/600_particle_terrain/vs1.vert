attribute vec3 position;
attribute vec2 texCoord;

uniform mat4 mvpMatrix;
uniform sampler2D noise_texture;
uniform float time;
uniform vec3 time_scale;
uniform vec3 distorition;
uniform float pointSize;

varying vec4 vColor;

void main() {
    vec3 p = position;
    // ピクセルシェーダーにテクスチャ座標をそのまま渡す
    float noiseTexR = texture2D(noise_texture, fract(texCoord - time * time_scale.x)).r;
    float noiseTexG = texture2D(noise_texture, fract(texCoord - time * time_scale.y)).g;
    float noiseTexB = texture2D(noise_texture, fract(texCoord - time * time_scale.z)).b;

    float height = 0.0;
    height += noiseTexR * distorition.x;
    height += noiseTexG * distorition.y;
    height += noiseTexB * distorition.z;

    p.y += height;

    gl_Position = mvpMatrix * vec4(p, 1.0);
    gl_PointSize = pointSize;

    vColor = vec4(1.0, 1.0, 1.0, 1.0);
}
