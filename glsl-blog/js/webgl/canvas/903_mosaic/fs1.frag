precision mediump float;

uniform float time;
uniform vec2 resolution;

const float mosaic_scale = 30.0;

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    // 縦横比を整えるため
    // 画面サイズが変わっても表示が崩れないようにするため
    // モザイクのドットサイズが画面サイズで崩れるのを防ぐため
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);

// 倍率を掛けて整数化、その後に倍率値で割る
// これで低解像度状態にできるみたい
    p = floor(p * mosaic_scale) / mosaic_scale;

// 式を分解してひとつひとつ試す
// それぞれを合成する事でアートを作る
    float a = p.x + time;
    // x軸方向の値をsinの角度として設定
    // 左下から右上へ向かって黒から白へ変わる
    float b = p.y + sin(a);
    // 0.05を元にbの値で割ると色が付く範囲を縮小出来る
    float c = 0.05 / abs(b);

    gl_FragColor = vec4(vec3(c), 1.0);
}