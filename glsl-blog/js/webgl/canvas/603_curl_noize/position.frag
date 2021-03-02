precision mediump float;

// 前フレームのデータテクスチャが必要
uniform sampler2D prevDataTextureUnit;
uniform sampler2D velocityTextureUnit;
uniform vec2 resolution;

void main() {
    vec2 coord = gl_FragCoord.st / resolution;
    vec4 prevPos = texture2D(prevDataTextureUnit, coord);
    vec4 velocity = texture2D(velocityTextureUnit, coord);

    float power = 1.0;
    float speed = 0.01;

    vec3 position = prevPos.xyz + velocity.xyz * speed * power;
    // 速度を常に加算しているので点がいずれ画面外に移動してしまうのを防ぐ
    {
        if(length(position) > 2.0) {
            // 原点から 0.1 の距離の位置に強制移動
            position = normalize(position) * 0.1;
        }
    }

    gl_FragColor = vec4(position, power);
}