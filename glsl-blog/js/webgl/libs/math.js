/**
 * 行列データは列優先基準で作成されているので注意
 * 右手座標系前提で作成されている
 * 移植する時は座標系がどちらかも意識しないとやばい
 */

// ラジアンと角度とを変換する逆数を生成

// 割り算をしないために用意
const RADIANS_UNIT = Math.PI / 180.0;
const INVERT_RADIANS_UNIT = 180.0 / Math.PI;

/**
 * ラジアンから角度に変換
 */
function RadiansToDegrees(in_radians) {
    return INVERT_RADIANS_UNIT * in_radians;
}

/**
 * 角度からラジアンに変える
 */
function DegreesToRadians(in_degrees) {
    return RADIANS_UNIT * in_degrees;
}

/**
 * ベクトルの3要素
 */
 class Vector3 {
     constructor(x, y, z) {
         this.x = x;
         this.y = y;
         this.z = z;
     }

     copy(v) {
         this.x = v.x;
         this.y = v.y;
         this.z = v.z;
     }

     array() {
         return [this.x, this.y, this.z];
     }

     /**
      * ベクトル同士の差分結果を設定
      * @param {*} a 
      * @param {*} b 
      */
     setSub(a, b) {
         this.x = a.x - b.x;
         this.y = a.y - b.y;
         this.z = a.z - b.z;
     }

     /**
      * ベクトル加算
      * @param {*} a 
      */
     add(a) {
         this.x = this.x + a.x;
         this.y = this.y + a.y;
         this.z = this.z + a.z;
     }

     /**
      * スケールを与えたベクトルを返す
      * @param {*} scale
      */
     getScaleVec(scale) {
         let v = new Vector3(this.x * scale, this.y * scale, this.z * scale);
         return v;
     }

     getNormalize() {
        let mag_sq = this.x * this.x + this.y * this.y + this.z * this.z;
        let length = 1.0;
        // 長さの2乗が１なら平方根も１なので計算は不要
        if (mag_sq != 1.0) {
            length = Math.sqrt(mag_sq);
        }

        let mag = 1.0 / length;
        return new Vector3(this.x * mag, this.y * mag, this.z * mag);
     }

     /**
      * 長さ１のベクトルに変更
      */
     normalize() {
        let mag_sq = this.x * this.x + this.y * this.y + this.z * this.z;
        let length = 1.0;
        // 長さの2乗が１なら平方根も１なので計算は不要
        if (mag_sq != 1.0) {
            length = Math.sqrt(mag_sq);
        }

        let mag = 1.0 / length;
        this.x *= mag;
        this.y *= mag;
        this.z *= mag;
     }
}

/**
 * ベクトルの外積
 * @param {*} a 
 * @param {*} b 
 */
function crossVector3(a, b) {
    let x = a.y * b.z - a.z * b.y;
    let y = a.z * b.x - a.x * b.z;
    let z = a.x * b.y - a.y * b.x;

    return new Vector3(x, y, z);
}

/**
 * ベクトルの内積
 * @param {*} a 
 * @param {*} b 
 */
function dotVector3(a, b) {
    return (a.x * b.x + a.y * b.y + a.z * b.z);
}

/**
 * ベクトルの4要素
 */
class Vector4 {
    constructor(x = 0.0, y = 0.0, z = 0.0, w = 0.0) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * 設定したベクトルで掛け算して代入
     * @param {*} vec4 
     */
    mul(vec4) {
        let x = this.x * vec4.x;
        let y = this.y * vec4.y;
        let z = this.z * vec4.z;
        let w = this.w * vec4.w;

        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * 設定したベクトルで掛け算して足した値を返す
     * @param {*} vec4 
     */
    addMul(vec4) {
        let x = this.x * vec4.x;
        let y = this.y * vec4.y;
        let z = this.z * vec4.z;
        let w = this.w * vec4.w;

        return (x + y + z + w);
    }
}

/**
 * 回転行列作成
 * @param {*} radian 
 * @param {*} axis 
 */
function createRotaionMatrix4x4(radian, axis) {
    let mat = new Matrix4x4();

    let q = new Quaternion();
    q.rotate(axis.array(), radian);

    return converMatrix4x4FromQuaternion(q);
}

/**
 * スケール行列作成
 * @param {*} scaleX 
 * @param {*} scaleY 
 * @param {*} scaleZ 
 */
function createScaleMatrix4x4(scaleX, scaleY, scaleZ) {
    let mat = new Matrix4x4();

    mat.m[0] = scaleX;
    mat.m[5] = scaleY;
    mat.m[10] = scaleZ;

    return mat;
}

/**
 * 平行移動行列
 * @param {*} vec3 
 */
function createTranslationMatrix4x4(vec3) {
    let mat = new Matrix4x4();

    mat.setColumns(
        new Vector4(1.0, 0.0, 0.0, 0.0),
        new Vector4(0.0, 1.0, 0.0, 0.0),
        new Vector4(0.0, 0.0, 1.0, 0.0),
        new Vector4(vec3.x, vec3.y, vec3.z, 1.0),
    );
    /*
    mat.setRows(
        new Vector4(1.0, 0.0, 0.0, vec3.x),
        new Vector4(0.0, 1.0, 0.0, vec3.y),
        new Vector4(0.0, 0.0, 1.0, vec3.z),
        new Vector4(0.0, 0.0, 0.0, 1.0),
    );
    */

    return mat;
}

/**
 * 射影行列作成(右手座標系)
 * なぜこんな式になるのかは以下のサイトが参考になる
 * https://qiita.com/ryutorion/items/0824a8d6f27564e850c9
 * @param {*} fovFromRadian 
 * @param {*} width 
 * @param {*} height 
 * @param {*} near 
 * @param {*} far 
 */
function createPerspectiveMatrix4x4FromRighthandCoordinate(fovFromDegress, width, height, near, far) {
    let fovFromRadian = DegreesToRadians(fovFromDegress);

    // cotの計算
    let yScale = 1.0 / Math.tan(fovFromRadian * 0.5);
    let xScale = yScale * (height / width);

    const distance = (far - near);

    let f = -(far + near) / distance;
    let f1 = -(far * near * 2.0) / distance;

    // 右手座標系なら-1 / 左手座標系なら1となる
    let w = -1.0;

    let mat = new Matrix4x4();
    mat.setColumns(
        new Vector4(xScale, 0.0,    0.0, 0.0),
        new Vector4(0.0,    yScale, 0.0, 0.0),
        new Vector4(0.0,    0.0,    f,   w),
        new Vector4(0.0,    0.0,    f1,  0.0)
    );
    /*
    mat.setRows(
        new Vector4(xScale, 0.0,    0.0, 0.0),
        new Vector4(0.0,    yScale, 0.0, 0.0),
        new Vector4(0.0,    0.0,    f,   f1),
        new Vector4(0.0,    0.0,    w,  0.0)
    );
    */

    return mat;
}

/**
 * ビュー行列作成(右手座標系)
 * @param {*} eye 
 * @param {*} target 
 * @param {*} up 
 */
function createLookAtMatrixt4x4FromRighthandCorrdinate(eye, target, up) {
    let zAxis = new Vector3();
    // 右手座標系だと e - t
    // しかし左手座標系だと t - eの逆ベクトルになる
    zAxis.setSub(eye, target);
    zAxis.normalize();

    let xAxis = crossVector3(up, zAxis);
    xAxis.normalize();

    let yAxis = crossVector3(zAxis, xAxis);
    yAxis.normalize();

    let trans = new Vector3(
        -dotVector3(xAxis, eye), 
        -dotVector3(yAxis, eye), 
        -dotVector3(zAxis, eye),
        );
    let mat = new Matrix4x4();
    mat.setColumns(
        new Vector4(xAxis.x, yAxis.x, zAxis.x, 0.0),
        new Vector4(xAxis.y, yAxis.y, zAxis.y, 0.0),
        new Vector4(xAxis.z, yAxis.z, zAxis.z, 0.0),
        new Vector4(trans.x, trans.y, trans.z, 1.0),
    );
    /*
    mat.setRows(
        new Vector4(xAxis.x, xAxis.y, xAxis.z, trans.x),
        new Vector4(yAxis.x, yAxis.y, yAxis.z, trans.y),
        new Vector4(zAxis.x, zAxis.y, zAxis.z, trans.z),
        new Vector4(0.0,     0.0,     0.0,     1.0),
    );
    */

    return mat;
}

/**
 * 4x4行列計算クラス
 */
class Matrix4x4 {
    /**
     * コンストラクト(引数を変えた多重定義は出来ない)
     */
    constructor() {
        // 縦４、横４の要素で4 x 4の16要素を作る
        this.m = new Float32Array(4 * 4);
        /*
        配列と行列表の対応表
        | 0 4 8  12 |
        | 1 5 9  13 |
        | 2 6 10 14 |
        | 3 7 11 15 |
        数字はインデックス
        */
        // 最初は単位行列にする
        this.identity();
    }

    /**
     * 行列値のコピー
     * @param {*} org_m4x4 
     */
    copy(org_m4x4) {
        this.m = org_m4x4.m.slice();
    }

    /**
     * 行列の各列の設定
     * @param {*} column1 
     * @param {*} column2 
     * @param {*} column3 
     * @param {*} column4 
     */
    setColumns(column1, column2, column3, column4) {
        // 1列目
        this.m[0] = column1.x;
        this.m[1] = column1.y;
        this.m[2] = column1.z;
        this.m[3] = column1.w;

        // 2列目
        this.m[4] = column2.x;
        this.m[5] = column2.y;
        this.m[6] = column2.z;
        this.m[7] = column2.w;

        // 3列目
        this.m[8] = column3.x;
        this.m[9] = column3.y;
        this.m[10] = column3.z;
        this.m[11] = column3.w;

        // 4列目
        this.m[12] = column4.x;
        this.m[13] = column4.y;
        this.m[14] = column4.z;
        this.m[15] = column4.w;
    }

    /**
     * 行毎にまとめて要素を設定
     * @param {*} row1 
     * @param {*} row2 
     * @param {*} row3 
     * @param {*} row4 
     */
    setRows(row1, row2, row3, row4) {
        // 1行目
        this.m[0]  = row1.x;
        this.m[4]  = row1.y;
        this.m[8]  = row1.z;
        this.m[12] = row1.w;

        // 2行目
        this.m[1] = row2.x;
        this.m[5] = row2.y;
        this.m[9] = row2.z;
        this.m[13] = row2.w;

        // 3行目
        this.m[2] = row3.x;
        this.m[6] = row3.y;
        this.m[10] = row3.z;
        this.m[14] = row3.w;

        // 4行目
        this.m[3] = row4.x;
        this.m[7] = row4.y;
        this.m[11] = row4.z;
        this.m[15] = row4.w;
    }

    /**
     * 単位行列の変換
     */
    identity() {
        this.m[0] = 1.0; this.m[1] = 0.0; this.m[2] = 0.0; this.m[3] = 0.0;
        this.m[4] = 0.0; this.m[5] = 1.0; this.m[6] = 0.0; this.m[7] = 0.0;
        this.m[8] = 0.0; this.m[9] = 0.0; this.m[10] = 1.0; this.m[11] = 0.0;
        this.m[12] = 0.0; this.m[13] = 0.0; this.m[14] = 0.0; this.m[15] = 1.0;
    }

    /**
     * 行列同士の掛け算
     * 掛け算の順番は this.m * mat
     * なぜなら行列は列優先なので掛ける順番が右から左になる
     * @param {*} mat 
     */
    mul(mat) {
        // 左側の行列生成
        let row01 = new Vector4(this.m[0], this.m[4], this.m[8], this.m[12]);
        let row02 = new Vector4(this.m[1], this.m[5], this.m[9], this.m[13]);
        let row03 = new Vector4(this.m[2], this.m[6], this.m[10], this.m[14]);
        let row04 = new Vector4(this.m[3], this.m[7], this.m[11], this.m[15]);

        // 右側の行列生成
        let col01 = new Vector4(mat.m[0], mat.m[1], mat.m[2], mat.m[3]);
        let col02 = new Vector4(mat.m[4], mat.m[5], mat.m[6], mat.m[7]);
        let col03 = new Vector4(mat.m[8], mat.m[9], mat.m[10], mat.m[11]);
        let col04 = new Vector4(mat.m[12], mat.m[13], mat.m[14], mat.m[15]);

        // 行列同士の計算
        let newCol01 = new Vector4(col01.addMul(row01), col01.addMul(row02), col01.addMul(row03), col01.addMul(row04));
        let newCol02 = new Vector4(col02.addMul(row01), col02.addMul(row02), col02.addMul(row03), col02.addMul(row04));
        let newCol03 = new Vector4(col03.addMul(row01), col03.addMul(row02), col03.addMul(row03), col03.addMul(row04));
        let newCol04 = new Vector4(col04.addMul(row01), col04.addMul(row02), col04.addMul(row03), col04.addMul(row04));

        // 1列目
        this.m[0] = newCol01.x; 
        this.m[1] = newCol01.y;
        this.m[2] = newCol01.z;
        this.m[3] = newCol01.w;

        // 2列目
        this.m[4] = newCol02.x;
        this.m[5] = newCol02.y;
        this.m[6] = newCol02.z;
        this.m[7] = newCol02.w;

        // 3列目
        this.m[8] = newCol03.x;
        this.m[9] = newCol03.y;
        this.m[10] = newCol03.z;
        this.m[11] = newCol03.w;

        // 4列目
        this.m[12] = newCol04.x;
        this.m[13] = newCol04.y;
        this.m[14] = newCol04.z;
        this.m[15] = newCol04.w; 
    }

    /**
     * 行列の各要素にスケール
     * TODO: 動作未検証
     * @param {*} scale 
     */
    scale(scale) {
        for (let i = 0; i < 4; ++i) {
            for (let j = 0; j < 4; ++j) {
                this.m[i * 4 + j] *= scale;
            }
        }
    }
}

/**
 * クォータニオン計算クラス
 * TODO: 実装途中
 */
class Quaternion {
    constructor() {
        // 単位クォータニオンで初期化
        this.identity();
    }

    /**
     * 単位クォータニオンを設定
     */
	identity() {
        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;
        this.w = 1.0;
    }

    /**
     * 各要素を設定
     * @param {*} x 
     * @param {*} y 
     * @param {*} z 
     * @param {*} w 
     */
    set(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    /**
     * クォータニオンの掛け算をして結果を代入
     * @param {*} q 
     */
    multiply(q) {
        let org = new Quaternion();
        org.set(this.x, this.y, this.z, this.w);

        this.x = org.x * q.w + org.w * q.x + org.y * q.z - org.z * q.y;
        this.y = org.y * q.w + org.w * q.y + org.z * q.x - org.x * q.z;
        this.z = org.z * q.w + org.w * q.z + org.x * q.y - org.y * q.x;
        this.w = org.w * q.w - org.x * q.x - org.y * q.y - org.z * q.z;
    }

    /**
     * 回転軸とて回転値を指定してクォータニオンを作る
     * @param {*} axis 
     * @param {*} angleFromRadian 
     */
	rotate(axis, angleFromRadian)
	{
        // axisを単位ベクトルにする必要がある
        let vec3 = new Vector3(axis[0], axis[1], axis[2]);
        vec3.normalize();

        const radian = angleFromRadian;

		const scaler = Math.sin(radian * 0.5);
		this.x = vec3.x * scaler;
		this.y = vec3.y * scaler;
		this.z = vec3.z * scaler;

		this.w = Math.cos(radian* 0.5);
    }
}

/**
 * クォータニオンを4x4行列に変換して返す
 * 列ベクトル基準に並べ変える
 * @param {*} q 
 */
function converMatrix4x4FromQuaternion(q) {
    let mat4 = new Matrix4x4();

    let x = q.x, y = q.y, z = q.z, w = q.w;
    let x2 = x + x, y2 = y + y, z2 = z + z;
    let xx = x * x2, xy = x * y2, xz = x * z2;
    let yy = y * y2, yz = y * z2, zz = z * z2;
    let wx = w * x2, wy = w * y2, wz = w * z2;

    // 1列n行
    mat4.m[0] = 1.0 - (yy + zz);
    mat4.m[1] = xy - wz;
    mat4.m[2] = xz + wy;
    mat4.m[3] = 0.0;

    // 2列n行
    mat4.m[4] = xy + wz;
    mat4.m[5] = 1.0 - (xx + zz);
    mat4.m[6] = yz - wx;
    mat4.m[7] = 0.0;

    // 3列n行
    mat4.m[8] = xz - wy;
    mat4.m[9] = yz + wx;
    mat4.m[10] = 1.0 - (xx + yy);
    mat4.m[11] = 0.0;

    // 4列n行
    mat4.m[12] = 0;
    mat4.m[13] = 0;
    mat4.m[14] = 0;
    mat4.m[15] = 1.0;

    return mat4;
}
