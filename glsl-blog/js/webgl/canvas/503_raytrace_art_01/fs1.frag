precision mediump float;

uniform float time;
uniform vec2 resolution;

const float ESP = 0.0001;

mat2 rot(float r) {
    return mat2(cos(r), sin(r), -sin(r), cos(r));
}

float cylinder(vec3 p, float h, float r) {
    vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(h,r);
    return min(max(d.x,d.y), 0.) + length(max(d, 0.));
}

float particle(vec3 p) {
    p.y += .1*sin(p.z*5.+time);
    p.xy *= rot(p.z*0.3);
    p.z += -time;
    p = mod(p, 0.4) - 0.25;
    return cylinder(p.xzy, .0, .04);
}

vec2 pmod(vec2 p, float n) {
    float np = 3.141592*2./n;
    float r = atan(p.x,p.y)-0.5*np;
    r=mod(r,np)-0.5*np;
    return length(p)*vec2(cos(r),sin(r));
}

float cube(vec3 p, vec3 s) {
    vec3 q = abs(p);
    vec3 m = max(s - q, 0.);
    // オンチップのグラフィックチップでは0除算が起きてレイとの距離がおかしくなるので0.001を足して暫定対処
    return length(max(q - s, 0.)) - min(min(m.x, m.y), m.z) + 0.001;
}

float mainDist(vec3 p) {
    p.z += 2.*time;
    p.xy = pmod(p.xy,6.);
    p = mod(p, 0.8)-0.4;


    float d0=cube(p, vec3(10, .05, .05));
    float d1=cube(p, vec3(.05,  10.,.05));
    float d2=cube(p, vec3(.05, .05, 10.));
    float d3=cube(p, vec3(.2, .2, .2));

    return min(d0,min(min(d1,d2),d3));
}

void main() {
    // 0.0 - 1.0 => -1.0 - 1.0に座標変換
    vec2 p = (gl_FragCoord.st * 2.0 - resolution) / min(resolution.x, resolution.y);
    // 画面の画素方向にレイを飛ばしている
    p *= rot(time);

    // レイの原点
    float radius=0.1;
    float phi=time*0.2;
    vec3 ro = vec3(cos(phi)*radius,0.,sin(phi)*radius);
    vec3 ta = vec3(0.,0.,0.);

    // カメラ
    vec3 cdir=normalize(ta-ro);
    vec3 side=cross(cdir,vec3(0.,1.,0.));
    vec3 up=cross(side,cdir);
    float fov=0.6;

    vec3 rd = normalize(p.x*side+p.y*up+cdir*fov);

    float d,d2, t = 0.;
    float mainEmissive=0.0;
    float particleEmissive = 0.;
    // ループ回数が増えせば球と球の間の小さな隙間にレイが通るが
    // 回数が増えると負荷があがるので危険
    for (int i = 0; i < 76; ++i) {
        d = mainDist(ro + rd * t);
        d2 = particle(ro+rd*t);
        if(d<d2) mainEmissive+=exp(abs(d)*-.2);
        if(d>d2) particleEmissive += .03/abs(d2);

        d = min(d,d2);
        // レイとオブジェクトがぶつかったら終了
        if (d < ESP) break;
        t += d;
    }

    vec3 col = 0.03*mainEmissive*vec3(1.,0.5,0.1);
    col += .1*particleEmissive*vec3(.1+.9*pow(abs(sin(time*3.141*4.)),4.),0.7,2.);
    gl_FragColor = vec4(col, 1.0);
}