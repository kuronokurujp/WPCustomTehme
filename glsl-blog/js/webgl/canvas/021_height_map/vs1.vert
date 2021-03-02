// 呼び出し元でバインドしてデータが転送されたが設定される
attribute vec3 position;
attribute vec2 texCoord;

// ピクセルシェーダーに渡す情報
varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    vec3 p = position;

    // ピクセルシェーダーにテクスチャ座標をそのまま渡す
    vTexCoord = texCoord;

    // 列ベクトル基準なので行列を前にする
    gl_Position = vec4(p, 1.0);
}