/**
 * ハイドマップテクスチャを利用したテクスチャの立体表示
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
        this.timeScale = 0.1;
        this.noiseViewFlag = false;
        this.polarCoordinateFlag = false;
        this.noiseType = 0;
        this.mouseMove = [0.0, 0.0];
        this.mouseScale = 0.05;
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

        this.canvas = canvas;
        this.shaderFrames = shaderFrames;
        {
            this.vPositions = [
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
            // 画像を反転を考えたテクスチャ座標になっている
            this.texcoords = [
                // 頂点左上 / テクスチャ座標左下
                0.0, 0.0,
                // 頂点右上 / テクスチャ座標右下
                1.0, 0.0,
                // 頂点右下 / テクスチャ座標右上
                1.0, 1.0,
                // 頂点左下 / テクスチャ座標左上
                0.0, 1.0,
            ];

            this.vertecIndexs = [
                0, 1, 3,
                1, 2, 3
            ];

            const shaderFrame = this.shaderFrames[0];
            shaderFrame.createAttributeLocation('position', 3, this.vPositions);
            // テクスチャ座標用
            shaderFrame.createAttributeLocation('texCoord', 2, this.texcoords);

            // テクスチャユニットは整数単位扱い、浮動小数ではないので注意
            shaderFrame.createUniformLocation('imageTexture', 'uniform1i');
            shaderFrame.createUniformLocation('higtMapTexture', 'uniform1i');
            shaderFrame.createUniformLocation('mouse', 'uniform2fv');
            shaderFrame.createUniformLocation('mouseScale', 'uniform1f');

            // 頂点インデックスを用意
            shaderFrame.createIndexBufferObject(this.vertecIndexs);
        }

        {
            window.addEventListener('mousemove', (evt) => {
                let x = evt.x / this.canvas.width * 2.0 - 1.0;
                let y = evt.y / this.canvas.height * 2.0 - 1.0;
                this.mouseMove[0] = x;
                this.mouseMove[1] = y;
            });
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
        {
            // 3Dのビューポートのサイズをプラウザのスクリーンサイズに合わせる
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
            // カラー + 深度バッファクリア
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            // メインテクスチャをテクスチャユニット0に
            {
                const texture = this.webGLFrame.textures[0];
                texture.enableSlot();
                texture.enableBind(true);
            }

            // ハイドマップテクスチャ
            // テクスチャユニット1に
            {
                const texture = this.webGLFrame.textures[1];
                texture.enableSlot();
                texture.enableBind(true);
            }

            // 指定シェーダーで描画
            const shaderFrame = this.shaderFrames[0];
            shaderFrame.use();

            // vertex反映
            {
                shaderFrame.setVertexAttribute(
                    shaderFrame.indexBufferObject[0]);
            }

            // uniform反映
            {
                shaderFrame.setUniform(
                    [
                        [0],
                        [1],
                        this.mouseMove,
                        this.mouseScale,
                    ]
                );
            }

            // 転送情報を使用して頂点を画面にレンダリング
            // インデックスバッファで描画
            gl.drawElements(gl.TRIANGLES, this.vertecIndexs.length, gl.UNSIGNED_SHORT, 0);
        }
    }

    /**
     * シェーダーファイル
     */
    getShaderFilePathArray() {
        return [
            ['./vs1.vert', './fs1.frag'],
        ]
    }

    /**
     * テクスチャのソース配列取得
     * ロードするテクスチャのファイルパス一覧
     * ここで記載しているテクスチャはロードされOpenGLのテクスチャデータとして生成される
     */
    getTextureSources() {
        return [
            './base.png',
            './height.png',
        ];
    }
}