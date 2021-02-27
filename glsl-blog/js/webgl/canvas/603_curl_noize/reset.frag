precision mediump float;

uniform vec2 resolution;

const float PI = 3.1415926;
const float PI2 = PI * 2.0;

void main() {
    vec2 p = (gl_FragCoord.st) / resolution;

    // 2PIの半分にしているのは 0 - 1 - 0の値のみを取るようにするため
    // 2PIにしてしまうと 0 - 1 - 0 - -1 - 0の値が取れてしまう
    // 円の下のスケールを０にして円の真ん中を１に
    // 円の一番上のスケール０と考えている。
    // こうする事で円の形状としている
    // ここを1で固定するとシリンダの形状になる
    float s =  sin(p.y * PI);
    // xの値で円の座標を取得する
    // 円のラインが出来る。しかし円の中身は空洞
    // sの値で円の大きさを少しずつ大きくすることで空洞をうめるようにしている
    // 扇形のようになる
    float x =  cos(p.x * PI2) * s;
    float z =  sin(p.x * PI2) * s;

    // -1 - 1の値を取得するため
    // 円の下から上の高さを求めている
    float y = -cos(p.y * PI);

    gl_FragColor = vec4(x, y, z, 0.0);
}