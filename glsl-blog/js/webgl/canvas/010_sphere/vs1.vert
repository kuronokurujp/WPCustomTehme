// ベクトルは列ベクトル
// 行列は横が列ベクトルで構成
/*
// OpenGL/GLSLは列ベクトル基準の行列要素の並び
mat = {
    m00 = 0, m10 = 4, m20 = 8, m30 = 12,
    m01 = 1, m11 = 5, m21 = 9, m31 = 13,
    m02 = 2, m12 = 6, m22 = 10, m32 = 14,
    m03 = 3, m13 = 7, m23 = 11, m33 = 15,
}
*/
// 呼び出し元でバインドしてデータが転送されたが設定される
attribute vec3 position;
attribute vec4 color;
uniform mat4 mvpMatrix;
uniform float time;

// ピクセルシェーダーに渡す情報
varying vec4 vColor;

void main() {

    vColor = color;


    vec3 normal = normalize(position);
    float s = sin(position.y * 2.0 + time) * 0.5;
    vec3 p = position + (normal * s * 0.5);

    // 列ベクトル基準なので行列を前にする
    gl_Position = mvpMatrix * vec4(p, 1.0);

    gl_PointSize = 2.0;
}