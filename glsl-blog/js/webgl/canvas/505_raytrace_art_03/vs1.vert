// 呼び出し元でバインドしてデータが転送されたが設定される
attribute vec3 position;

void main() {
    vec3 p = position;
    gl_Position = vec4(p, 1.0);
}