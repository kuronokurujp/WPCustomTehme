/**
 * シェーダーアートのひな型
 */
class ExtendsCanvas3D extends Canvas3D {
    constructor() {
        super();

        this.shaderVersion = 1;
        this.version = 2;
        this.webGLFrame = null;

        this.positions = [];
        this.pointColors = [];
        this.pointIndexs = []; 
        this.texCoords = [];
    }

    /**
     * 設定
     */
    setup(webGLFrame, shaderFrames) {
        this.webGLFrame = webGLFrame;

        const canvas = this.webGLFrame.canvas;
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

            this.vertecIndexs = [
                0, 1, 3,
                1, 2, 3
            ];

            const shaderFrame = this.shaderFrames[0];
            shaderFrame.createAttributeLocation('position', 3, this.vPositions);

            // 頂点インデックスを用意
            shaderFrame.createIndexBufferObject(this.vertecIndexs);

            // uniform定義
            shaderFrame.createUniformLocation('time', 'uniform1f');
            shaderFrame.createUniformLocation('resolution', 'uniform2fv');
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
                        time,
                        [this.canvas.width, this.canvas.height],
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
        // クエリでフラグメントシェーダーファイルを受け取る
        // ないとエラーになる
        var query = window.location.search.substr(1);
        var parames = query.split('#');
        var fs_path = null;
        parames.forEach(element => {
            var datas = element.split('=');
            console.log(datas);
            if (datas[0] === 'fs_path') {
                fs_path = datas[1];
            }
        });

        return [
            ['./vs1.vert', fs_path],
        ]
    }
}