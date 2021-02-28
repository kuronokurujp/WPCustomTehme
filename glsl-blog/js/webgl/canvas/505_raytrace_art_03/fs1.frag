// 0除算が起きてうまく表示出来ないケースがたたある
// グラフィックボードだとうまくいくが、オンボードタイプだとうまくいかないケースがある
precision highp float;

uniform float time;
uniform vec2 resolution;

const float ESP = 0.0001;
const float PI=3.141592;

vec2 pmod(vec2 p, float n) {
    float np = PI*2./n;
    float r = atan(p.x,p.y)-0.5*np;
    r=mod(r,np)-0.5*np;
    return length(p)*vec2(cos(r),sin(r));
}

mat2 rot(float a) {
    return mat2(cos(a), sin(a), -sin(a), cos(a));
}

float sdLink(vec3 p, float le, float r1, float r2) {
    vec3 q=vec3(p.x, max(abs(p.y)-le,0.), p.z);
    float l = length(vec2(length(q.xy)-r1,q.z))-r2;
    return l;
}

float kusari(vec3 p) {
    vec3 p_yaxis=p+vec3(0.,-8.,.0);
    float d=sdLink(p_yaxis,.4,.4,.2);
    for (float i=0.;i<14.;++i) {
        vec3 tmp_p=p_yaxis;
        float s=0.;
        float y=1.*(i+1.);
        tmp_p+=vec3(s,y,0.);
        tmp_p.xz*=rot(mod(i,2.));
        float d01=sdLink(tmp_p,.4,.4,.2);
        d=min(d,d01);
    }
    return d;
}
float mainDist(vec3 p) {
    p.z+=time*1.2;
    p.xy=pmod(p.xy,8.);
    p=mod(p,12.)-6.;
    float d01=kusari(p);
    p.xy*=rot(0.5*PI);
    float d02=kusari(p);

    return min(d01,d02);
}

void main() {
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);

    // カメラワーク
    float radius=4.;
    float phi=0.5*3.14;
    vec3 ro=vec3(cos(phi)*radius,0.,sin(phi)*radius);
    vec3 ta=vec3(0.,0.,0.);

    vec3 cdir=normalize(ta-ro);
    vec3 side=cross(cdir,vec3(0.,1.,0.));
    // カメラのsideベクトルを回転させてターゲット方向に向けたカメラを回す
    side.xy*=rot(time*0.2);
    vec3 up=cross(side,cdir);
    float fov=1.5;

    vec3 rd = normalize(p.x*side+p.y*up+cdir*fov);

    float d, t = 0.;
    float mainEmissive=0.;
    for (int i = 0; i < 32; ++i) {
        d = mainDist(ro + rd * t);
        // レイとオブジェクトがぶつかったら終了
        mainEmissive+=exp(abs(d)*-.2);
        if (d<ESP) break;
        t += d;
    }

    /*
    vec3 col=vec3(1.0-length(p));
    if (d<ESP){
        col=0.03*mainEmissive*vec3(.8,.8,.8);
    }
    */
    // ↑と同じ, 下記のQitaサイトをまねた
    // https://qiita.com/yuichiroharai/items/6e378cd128279ac9a2f0
    vec3 col=mix(vec3(1.0-length(p)),0.03*mainEmissive*vec3(.8,.8,.8),vec3(1.0)-step(ESP,d));

    gl_FragColor = vec4(col, 1.0);
}