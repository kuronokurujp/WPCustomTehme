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
attribute vec2 texCoord;

uniform mat4 mvpMatrix;

// ピクセルシェーダーに渡す情報
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    vec3 p = position;

    vColor = color;
    // ピクセルシェーダーにテクスチャ座標をそのまま渡す
    vTexCoord = texCoord;

    // 列ベクトル基準なので行列を前にする
    gl_Position = mvpMatrix * vec4(p, 1.0);
    gl_PointSize = 4.0;
}