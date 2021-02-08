attribute vec3 position;
attribute vec2 texCoord;
// xyzwにそれぞれ異なるランダム値が詰まっている
// xyzwの要素には意味がないので注意
// 0-1値が入っている
attribute vec4 randoms;

uniform float time;
uniform mat4 mvpMatrix;
uniform float scaleXY;
uniform float moveZScale;
uniform float fogArea;
uniform float pointAreaSize;

varying vec4 vColor;
varying vec2 vTexCoord;

void main() {
    // 経過時間を一律にせずにランダム値を加算してばらつきを作る
    float t = time + randoms.w;

    // ランダム値を格納した4つの値の扱いが
    // コードを見て分かりやすくするためにランダム名を持った変数に置き換えている
    // コードのわかりやすさ重視
    float random01 = randoms.x;
    float random02 = randoms.y;
    float random03 = randoms.z;
    float random04 = randoms.w;

    // cos/sinで-1 - 1の間をループさせる事で点の移動を一定の範囲内で行ったり来たりさせている
    // ここは一定範囲内で行ったり来たりしていればいい
    // cos/sinを使うと値の流れが直線ではなく曲線になるので移動量に面白さがつけれる
    float moveZ = sin(random03 * t);

    // zが-pointAreaSize - pointAreaSizeの値が入っている前提にしないとだめ
    // zを0 - 1に変換
    float z = position.z / pointAreaSize;
    z = (z + 1.0) * 0.5;

    // fractで小数点以下の数値を取り出す
    // つまり1.0未満になる
    z = fract(z + t + moveZ);

    // この段階でzは0.0 - 1.0未満となりsmoothstepで補間
    // この関数は0.0以下なら0.0で固定, fogArea以上なら1.0で固定
    // 0.0 < x < fogAreaなら0.0 - fogAreaの間を曲線上の値で補間するおもろい関数
    // このサイトが分かりやすい
    // https://qiita.com/aa_debdeb/items/1165b98ec596ee20b519
    // つまり0.0 < z < fogArea の間は曲線上の値を取り、それ以外は0.0 or 1.0の値を取る
    // なのでalphaは0.0 <= alpha <= 1.0の値になる
    // つまり奥にある点程アルファ値が小さくなる
    float alpha = smoothstep(0.0, fogArea, z);

    vec3 p = vec3(
        position.x,
        position.y,
        position.z + moveZ * moveZScale
    );

    // XZ平面上での回転 + XZ平面上でのスケール
    mat2 mul = mat2(cos(t) * random01, sin(t) * random01, 
                    -sin(t) * random02, cos(t) * random02) * 
                mat2(scaleXY, 0.0, 0.0, scaleXY);
    p.xz *= mul;

    gl_Position = mvpMatrix * vec4(p, 1.0);
    gl_PointSize = 2.0;

    vColor = vec4(1.0, 1.0, 1.0, alpha);
    vTexCoord = texCoord;
}