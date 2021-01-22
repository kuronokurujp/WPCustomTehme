/**
 * 板ポリ表示
 * 三角形を２つ作成して四角形表示出来た
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

        // 調整パネルGUIの入力イベント作成
        /*
            GUI製作ライブラリ「tweakpane」を利用
            ありがとうございます！
            https://github.com/cocopon/tweakpane
        */
        this.is_face = false;
        {
            const PANE = new Tweakpane({
                container: document.querySelector('#pane')
            });
            PANE.addInput({face: this.is_face}, 'face')
            .on('change', (v) => {
                this.is_face = v;
            });
        }

        this.canvas = canvas;
        this.mouseInterctionCamera = new MouseInterctionCamera();
        this.mouseInterctionCamera.setup(this.canvas);

        this.positions = [];
        this.pointColors = [];
        this.pointIndexs = []; 

        // ループ処理で幾何形状の頂点を作成している
        // 使いまわせる！
        const VERTEX_COUNT = 1;
        const WIDTH = 2.0;
        for (let i = 0; i <= VERTEX_COUNT; ++i) {

            let x = (i / VERTEX_COUNT) * WIDTH;
            x -= (WIDTH * 0.5);
            for (let j = 0; j <= VERTEX_COUNT; ++j) {
                let y = (j / VERTEX_COUNT) * WIDTH;
                y -= (WIDTH * 0.5);

                // 頂点情報設定
                this.positions.push(x, y, 0.0);
                // 頂点色
                this.pointColors.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 1.0, 1.0);

                // 頂点インデックス追加
                // この方法は四角形、球形などポリゴンが閉じた形状なら有効
                if (i > 0 && j > 0) {
                    let firstBaseIndex = (i - 1) * (VERTEX_COUNT + 1) + j;
                    let secondBaseIndex = (i) * (VERTEX_COUNT + 1) + j;

                    this.pointIndexs.push(
                        firstBaseIndex - 1, firstBaseIndex, secondBaseIndex - 1,
                        secondBaseIndex - 1, firstBaseIndex, secondBaseIndex,
                    );
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

        // 列優先行列なので右から左に掛ける
        // 射影行列 * ビュー行列
        this.mat.copy(mProjection);
        this.mat.mul(this.mView);

        // マウスで回転行列を座標変換に与える
        // カメラを回転させている
        let quaternionMatrix4x4 = converMatrix4x4FromQuaternion(this.mouseInterctionCamera.rotationQuaternion);
        // 射影行列 * ビュー行列 * マウス行列
        this.mat.mul(quaternionMatrix4x4);

        // 射影行列 * ビュー行列 * マウス行列 * モデル行列
        this.mat.mul(this.mWorld);

        // 転送情報を使用して頂点を画面にレンダリング
        // 第三引数に頂点数を渡している
        if (this.is_face === false) {
            this.gl.drawArrays(this.gl.POINTS, 0, this.getPointCount());
        }
        else {
            // インデックスバッファで描画
            this.gl.drawElements(this.gl.TRIANGLES, this.getPointIndexs().length, this.gl.UNSIGNED_SHORT, 0);
        }
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
        ]
    }

    /**
     * Uniformの変数のタイプ
     */
    getUniformTypes() {
        return [
            'uniform4fv',
            'uniformMatrix4fv',
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
        ];
    }

    /**
     * 頂点のインデックスバッファデータ取得
     * 1オブジェクトのみしか対応していない
     */
    getPointIndexs() {
        // 配列で返す
        return this.pointIndexs;
    }
}