/**
 * 3D空間にボックスのポリゴンを表示して頂点シェーダーで頂点座標をsinカーブで動かす
 */
class ExtendsCanvas3D extends Canvas3D {
    /**
     * 設定
     * @param {*} shaderProgram 
     * @param {*} gl 
     * @param {*} canvas 
     */
    setup(shaderProgram, gl, canvas) {
        super.setup(shaderProgram, gl, canvas);

        this.canvas = canvas;
        this.mouseInterctionCamera = new MouseInterctionCamera();
        this.mouseInterctionCamera.setup(this.canvas);

        // 頂点座標の定義
        const VERTEX_COUNT = 100;  // 頂点の個数
        const VERTEX_WIDTH = 1.0;  // 頂点が並ぶ範囲の広さ
        this.positions = [];       // 頂点座標
        this.pointColors = [];     // 頂点色
        for(let i = 0; i < VERTEX_COUNT; ++i){
            // 0.0 - 1.0の値になる
            let x = i / VERTEX_COUNT;
            // 横の大きさに変換
            x = x * VERTEX_WIDTH;
            // 横の大きさの半分を左下にずらす事で中心位置をピボットにしている
            x = x - (VERTEX_WIDTH / 2.0);
            for(let j = 0; j < VERTEX_COUNT; ++j){
                let y = j / VERTEX_COUNT;
                y = y * VERTEX_WIDTH;
                y = y - (VERTEX_WIDTH / 2.0);

                for(let k = 0; k < VERTEX_COUNT; ++k) {
                    let z = k / VERTEX_COUNT;
                    z = z * VERTEX_WIDTH;
                    z = z - (VERTEX_WIDTH / 2.0);
                    this.positions.push(x, y, z);
                    this.pointColors.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 0.5, 1.0);
                }
            }
        }

        // 座標変換行列作成

        // ローカルからワールド座標系に変換する行列
        this.mWorld = new Matrix4x4();
        this.mWorld.mul(createTranslationMatrix4x4(new Vector3(0.0, 0.0, 0.0)));

        // ワールドからビュー座標系に変換する行列
        // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
        this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));

        this.mat = new Matrix4x4();
    }

    isRenderAnimation() {
        return true;
    }

    /**
     * 描画
     */
    render() {
        this.mouseInterctionCamera.update();

        // fov値を決める
        let fov = 60 * this.mouseInterctionCamera.fovScale;

        // ビューからクリップ座標系に変換する行列
        // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
        let mProjection = createPerspectiveMatrix4x4FromRighthandCoordinate(
            fov,
            this.canvas.width,
            this.canvas.height,
            0.1,
            10.0);

        this.mat.copy(mProjection);
        this.mat.mul(this.mView);

        let quaternionMatrix4x4 = converMatrix4x4FromQuaternion(this.mouseInterctionCamera.rotationQuaternion);
        this.mat.mul(quaternionMatrix4x4);

        this.mat.mul(this.mWorld);

        // 転送情報を使用して頂点を画面にレンダリング
        // 第三引数に頂点数を渡している
        this.gl.drawArrays(this.gl.POINTS, 0, this.getPointCount());
    }

    /**
     * 頂点シェーダーファイル
     */
    getVertexShaderFilePath() {
        return './vs1.vert';
    }

    /**
     * ピクセルシェーダーファイル
     */
    getFragmentShaderFilePath() {
        return './fs1.frag';
    }

    /**
     * 頂点シェーダーの変数
     */
    getAttributeLoactions() {
        return [
            this.gl.getAttribLocation(this.shaderProgram, 'position'),
            this.gl.getAttribLocation(this.shaderProgram, 'color'),
        ];
    }

    /**
     * 頂点シェーダーの変数要素数
     */
    getAttributeStrides() {
        return [
            3,
            4,
        ];
    }

    /**
     * 頂点シェーダーに渡す属性値リスト
     */
    getOtherVertexAttributes() {
        return [
            this.pointColors,
        ];
    }

    /**
     * 頂点のサイズ
     */
    getPointSizes() {
        return null; 
    }

    /**
     * 頂点シェーダーがあつかう頂点座標
     */
    getPositions() {
        return this.positions;
    }

    /**
     * Uniformの変数
     */
    getUniformLocations() {
        return [
            this.gl.getUniformLocation(this.shaderProgram, 'globalColor'),
            // 座標変換の行列(射影・ビュー・モデルを一括計算した行列)
            this.gl.getUniformLocation(this.shaderProgram, 'mvpMatrix'),
            // タイマー
            this.gl.getUniformLocation(this.shaderProgram, 'time'),
        ]
    }

    /**
     * Uniformの変数のタイプ
     */
    getUniformTypes() {
        return [
            'uniform4fv',
            'uniformMatrix4fv',
            'uniform1fv',
        ];
    }

    /**
     * Uniformに渡す値
     */
    getUniformLocationsValues(time) {
        return [
            // 色
            [1, 1, 1, 1],
            [this.mat.m],
            [time],
        ];
    }
}