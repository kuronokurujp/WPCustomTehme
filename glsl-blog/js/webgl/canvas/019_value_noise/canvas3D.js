/**
 * ポストエフェクト
 * バリューノイズをポストエフェクト
 */
class ExtendsCanvas3D extends Canvas3D {
    constructor() {
        super();

        this.shaderVersion = 1;
        this.version = 2;
        this.webGLFrame = null;

        this.frameBuffers = [];
        this.positions = [];
        this.pointColors = [];
        this.pointIndexs = []; 
        this.texCoords = [];

        this.noiseStrength = 1.0;
    }

    /**
     * 設定
     */
    setup(webGLFrame, shaderFrames) {
        this.webGLFrame = webGLFrame;

        const canvas = this.webGLFrame.canvas;

        // 調整パネルGUIの入力イベント作成
        /*
            GUI製作ライブラリ「tweakpane」を利用
            ありがとうございます！
            https://github.com/cocopon/tweakpane
        */
        // ノイズ係数
        {
            const PANE = new Tweakpane({
                container: document.querySelector('#pane')
            });
            // 値のオブジェクト名と初期値設定の引数名と一致しないとエラーになる
            PANE.addInput({'noise': this.noiseStrength}, 'noise', {min: 0.0, max: 1.0})
            .on('change', (v) => {
                this.noiseStrength = v;
            });
        }

        this.canvas = canvas;
        this.shaderFrames = shaderFrames;
        this.mouseInterctionCamera = new MouseInterctionCamera();
        this.mouseInterctionCamera.setup(this.canvas);

        // フレームバッファを作成
        // 画面サイズに合わせる
        {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.frameBuffers[0] = this.webGLFrame.createFrameBuffer(this.canvas.width, this.canvas.height);

            // 画面サイズが変わった時にフレームバッファを削除して作成する
            // サイズが変わったフレームバッファを作らないと変わった画面サイズに対応した挙動にならない
            window.addEventListener('resize', () => {
                this.deleteFunction = () => {
                    this.frameBuffers.forEach((frameBuffer, index) => {
                        // フレームバッファを消す
                        this.webGLFrame.deleteFrameBuffer(this.frameBuffers[index]);

                        // リサイズしたサイズでフレームバッファを作る
                        this.canvas.width = window.innerWidth;
                        this.canvas.height = window.innerHeight;
                        this.frameBuffers[index] = this.webGLFrame.createFrameBuffer(this.canvas.width, this.canvas.height);
                    });
                };
            });
        }

        // 1つ目のシェーダー作成とそのシェーダーにアタッチするポリゴン情報生成
        {
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
                    this.pointColors.push(1.0, 1.0, 1.0, 1.0);

                    // 頂点インデックス追加
                    if (i > 0 && j > 0) {
                        let firstBaseIndex = (i - 1) * (VERTEX_COUNT + 1) + j;
                        let secondBaseIndex = (i) * (VERTEX_COUNT + 1) + j;

                        this.pointIndexs.push(
                            firstBaseIndex - 1, firstBaseIndex, secondBaseIndex - 1,
                            secondBaseIndex - 1, firstBaseIndex, secondBaseIndex,
                        );
                    }

                    this.texCoords.push(
                        (i / VERTEX_COUNT), 1.0 - (j / VERTEX_COUNT),
                    );
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

            const shaderFrame = this.shaderFrames[0];
            // シェーダーに情報を設定
            {
                // 頂点シェーダーに設定できる変数の参照情報を作成
                // 頂点シェーダーの変数に対応するストライドを配列に入れる
                // 頂点座標から頂点バッファを生成
                shaderFrame.createAttributeLocation('position', 3, this.positions);
                shaderFrame.createAttributeLocation('color', 4, this.pointColors);
                // テクスチャ座標用
                shaderFrame.createAttributeLocation('texCoord', 2, this.texCoords);

                // ピクセルシェーダーに設定できる変数の参照情報を作成
                // uniform変数に対応するタイプを配列に設定
                shaderFrame.createUniformLocation('globalColor', 'uniform4fv');
                shaderFrame.createUniformLocation('mvpMatrix', 'uniformMatrix4fv');

                // テクスチャユニットは整数単位扱い、浮動小数ではないので注意
                shaderFrame.createUniformLocation('textureUnit01', 'uniform1i');
            }

            // インデックスバッファのデータがあれば生成
            shaderFrame.createIndexBufferObject(this.pointIndexs);
        }

        // ポストエフェクト用のシェーダー作成とそれに関する情報生成
        {
            this.postEffectPositions = [
                // 左上
                -1.0, 1.0, 0.0,
                // 右上
                1.0, 1.0, 0.0,
                // 右下
                1.0, -1.0, 0.0,
                // 左下
                -1.0, -1.0, 0.0,
            ];

            // テクスチャ座標系に従う
            this.postEffectTexcoords = [
                // 頂点左上 / テクスチャ座標左下
                0.0, 0.0,
                // 頂点右上 / テクスチャ座標右下
                1.0, 0.0,
                // 頂点右下 / テクスチャ座標右上
                1.0, 1.0,
                // 頂点左下 / テクスチャ座標左上
                0.0, 1.0,
            ];

            this.postEffectVertecIndex = [
                0, 1, 3,
                1, 2, 3
            ];

            const shaderFrame = this.shaderFrames[1];
            shaderFrame.createAttributeLocation('position', 3, this.postEffectPositions);
            // テクスチャ座標用
            shaderFrame.createAttributeLocation('texCoord', 2, this.postEffectTexcoords);

            // テクスチャユニットは整数単位扱い、浮動小数ではないので注意
            shaderFrame.createUniformLocation('textureUnit01', 'uniform1i');

            // ノイズ係数
            shaderFrame.createUniformLocation('noiseStrength', 'uniform1f');
            // タイム
            shaderFrame.createUniformLocation('time', 'uniform1f');
            // 画面解像度
            shaderFrame.createUniformLocation('resolution', 'uniform2fv')

            // 頂点インデックスを用意
            shaderFrame.createIndexBufferObject(this.postEffectVertecIndex);
        }
    }

    isRenderAnimation() {
        return true;
    }

    /**
     * 描画
     */
    render(time) {
        const gl = this.webGLFrame.gl_context;

        // フレームバッファを削除イベントがあれば実行
        if (this.deleteFunction != null) {
            this.deleteFunction();
            this.deleteFunction = null;
        }

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

        // フレームバッファに描画内容を書き込む
        {
            // 画面を塗りつぶす色設定
            // 黒色の箇所はノイズが起きないので灰色にする
            gl.clearColor(0.4, 0.4, 0.4, 1.0);

            // オフスクリーンレンダリングを有効にする
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[0].framebuffer);
            // 3Dのビューポートのサイズをプラウザのスクリーンサイズに合わせる
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            // カラー + 深度バッファクリア
            // 塗りつぶす色が反映
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // テクスチャユニット0を有効にしてバインド
            {
                const texture = this.webGLFrame.textures[0];
                texture.enableSlot();
                texture.enableBind(true);
            }

            // 指定シェーダーで描画
            const shaderFrame = this.shaderFrames[0];
            shaderFrame.use();

            // vertex反映
            {
                shaderFrame.setVertexAttribute(
                    shaderFrame.vertexBufferObjects, 
                    shaderFrame.attributeLoacions, 
                    shaderFrame.attributeStrides, 
                    shaderFrame.indexBufferObject[0]);
            }

            // uniform反映
            {
                shaderFrame.setUniform(
                    [
                        // 色
                        [1, 1, 1, 1],
                        [this.mat.m],
                        // テクスチャユニット番号
                        [0],
                    ],
                );
            }

            // 転送情報を使用して頂点を画面にレンダリング
            // インデックスバッファで描画
            gl.drawElements(gl.TRIANGLES, this.pointIndexs.length, gl.UNSIGNED_SHORT, 0);
        }

        // ポストエフェクト描画をする
        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            // 3Dのビューポートのサイズをプラウザのスクリーンサイズに合わせる
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            // カラー + 深度バッファクリア
            // 塗りつぶす色が反映
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // フレームバッファのテクスチャをフラグメントシェーダーに渡す
            let frameBufferTexture = new TextureFrame(gl, 0, this.frameBuffers[0].texturebuffer);
            frameBufferTexture.enableSlot();
            frameBufferTexture.enableBind(true);

            // 指定シェーダーで描画
            const shaderFrame = this.shaderFrames[1];
            shaderFrame.use();

            // vertex反映
            {
                shaderFrame.setVertexAttribute(
                    shaderFrame.vertexBufferObjects, 
                    shaderFrame.attributeLoacions, 
                    shaderFrame.attributeStrides, 
                    shaderFrame.indexBufferObject[0]);
            }

            // uniform反映
            {
                shaderFrame.setUniform(
                    [
                        [0],
                        this.noiseStrength,
                        time,
                        [this.canvas.width, this.canvas.height],
                    ]
                );
            }

            // 転送情報を使用して頂点を画面にレンダリング
            // インデックスバッファで描画
            gl.drawElements(gl.TRIANGLES, this.postEffectVertecIndex.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    /**
     * シェーダーファイル
     */
    getShaderFilePathArray() {
        return [
            ['./vs1.vert', './fs1.frag'],
            ['./vs2.vert', './fs2.frag'],
        ]
    }

    /**
     * テクスチャのソース配列取得
     * ロードするテクスチャのファイルパス一覧
     * ここで記載しているテクスチャはロードされOpenGLのテクスチャデータとして生成される
     */
    getTextureSources() {
        return [
            './sample01.jpg',
        ];
    }
}