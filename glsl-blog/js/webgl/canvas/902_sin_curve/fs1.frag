precision mediump float;

uniform float time;
uniform vec2 resolution;

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec3 p = vec3(vec2((gl_FragCoord.st * 2.0 - resolution) / resolution), 0.0);

// 式を分解してひとつひとつ試す
// 式がまとまっているのを分解してそれぞれ何をしているのかを把握するべき
// それぞれを合成する事でアートを作る
    float a = p.x + time;
    // x軸方向の値をsinの角度として設定
    // 左下から右上へ向かって黒から白へ変わる
    float b = p.y + sin(a);
    // 0.05を元にbの値で割ると色が付く範囲を縮小出来る
    // 0.05 / 1.0 = 0.05
    // 0.05 / 0.1 = 0.5
    // 0.05 / 0.01 = 5
    // abs(b)の値は0 <= n になる
    // 小さい値程大きな値になる
    // 画面の真ん中程値が小さいかくなるので色が白に近づく
    float c = 0.05 / abs(b);

    gl_FragColor = vec4(vec3(c), 1.0);
}