// ポストエフェクト用
attribute vec3 position;
attribute vec2 texCoord;

// ピクセルシェーダーに渡す情報
varying vec2 vTexCoord;

void main() {
    // ピクセルシェーダーにテクスチャ座標を渡す
    // 縦を1で判定させている
    vTexCoord = vec2(texCoord.x, 1.0 - texCoord.y);

    // 列ベクトル基準なので行列を前にする
    gl_Position = vec4(position, 1.0);
}