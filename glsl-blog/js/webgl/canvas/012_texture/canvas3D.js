/**
 * 板ポリ表示
 * かつテクスチャを張り付けて表示
 */
class texture extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'texture';
        this.texture_name = 'texture';
        this.texture_2_name = 'texture02';

        // 3Dカメラの制御
        this.mouseInterctionCamera = CameraController.createMouseInterction();
        this.mouseInterctionCamera.setup(webGL_data_container.canvas);

        this.is_face = true;
        this.parame_pane = null;
        {
            let pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });
                this.parame_pane.addInput({ face: this.is_face }, 'face')
                    .on('change', (v) => {
                        this.is_face = v;
                    });
            }
        }

        // 座標変換行列作成
        {
            // ワールドからビュー座標系に変換する行列
            // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));
            this.mat = new Matrix4x4();
        }

        // VBO And IBO作成する情報リスト
        {
            this.vbo_datas = {
                positions: {
                    name: 'position',
                    stride_count: 3,
                    datas: [],
                },

                colors: {
                    name: 'color',
                    stride_count: 4,
                    datas: [],
                },

                texcoords: {
                    name: 'texCoord',
                    stride_count: 2,
                    datas: [],
                },
            };

            this.ido_buffer_data = [];

            // ループ処理で幾何形状の頂点を作成している
            const VERTEX_COUNT = 1;
            const WIDTH = 2.0;
            for (let i = 0; i <= VERTEX_COUNT; ++i) {

                let x = (i / VERTEX_COUNT) * WIDTH;
                x -= (WIDTH * 0.5);
                for (let j = 0; j <= VERTEX_COUNT; ++j) {
                    let y = (j / VERTEX_COUNT) * WIDTH;
                    y -= (WIDTH * 0.5);

                    // 頂点情報設定
                    this.vbo_datas.positions.datas.push(x, y, 0.0);
                    // 頂点色
                    //this.vbo_datas.colors.datas.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 1.0, 1.0);
                    this.vbo_datas.colors.datas.push(1.0, 1.0, 1.0, 1.0);

                    // 頂点インデックス追加
                    if (i > 0 && j > 0) {
                        let firstBaseIndex = (i - 1) * (VERTEX_COUNT + 1) + j;
                        let secondBaseIndex = (i) * (VERTEX_COUNT + 1) + j;

                        this.ido_buffer_data.push(
                            firstBaseIndex - 1, firstBaseIndex, secondBaseIndex - 1,
                            secondBaseIndex - 1, firstBaseIndex, secondBaseIndex,
                        );
                    }

                    this.vbo_datas.texcoords.datas.push(
                        (i / VERTEX_COUNT), 1.0 - (j / VERTEX_COUNT),
                    );
                }
            }
        }

        // uniformを作成するデータ
        this.uniform_datas = {
            global_color: {
                name: 'globalColor',
                type: 'uniform4fv',
                datas: [1, 1, 1, 1],
            },
            mvp_mtx: {
                name: 'mvpMatrix',
                type: 'uniformMatrix4fv',
                datas: this.mat.m
            },
            texture_unit: {
                name: 'textureUnit',
                type: 'uniform1i',
                datas: 0
            }
        };
    }

    /**
     * ロード
     */
    load() {
        return new Promise((reslove) => {
            const data_container = this.webGL_data_container;

            // シェーダーをロード
            let load_shader_promise = data_container.createShaderFrame(
                this.shader_frame_name,
                this.data_file_path + '/vs1.vert',
                this.data_file_path + '/fs1.frag');

            // テクスチャをロード
            let load_texture_promise = data_container.createTextures(
                this.texture_name,
                this.uniform_datas.texture_unit.datas,
                this.data_file_path + '/sample.jpg');

            // テクスチャをロード
            let load_texture_2_promise = data_container.createTextures(
                this.texture_2_name,
                this.uniform_datas.texture_unit.datas,
                this.data_file_path + '/sample_2.jpg');

            Promise.all(
                [load_shader_promise,
                load_texture_promise,
                load_texture_2_promise,
            ])
                .then((load_results) => {
                    const shader_frame = load_results[0];
                    // vboを作成
                    for (let key in this.vbo_datas) {
                        let location = this.vbo_datas[key];

                        shader_frame.createVBOAttributeData(
                            location.name,
                            location.stride_count,
                            location.datas);
                    };

                    // idoを作成
                    shader_frame.createIndexBufferObject('index', this.ido_buffer_data);

                    // uniform作成
                    for (let key in this.uniform_datas) {
                        const uniform_data = this.uniform_datas[key];
                        shader_frame.createUniformObject(uniform_data.name, uniform_data.type);
                    }

                    reslove();
                });
        });
    }

    /**
     * メモリやオブジェクトの解放
     */
    dispose() {
        this.webGL_data_container = null;
        if (this.parame_pane != null)
            this.parame_pane.dispose();
        this.parame_pane = null;

        common_module.freeObject(this.vbo_datas);
        this.vbo_datas = null;

        common_module.freeObject(this.uniform_datas);
        this.uniform_datas = null;

        common_module.freeObject(this.ido_buffer_data);
        this.ido_buffer_data = null;
    }

    /**
     * 更新
     */
    update(time) {
        const webGL_data_container = this.webGL_data_container;

        this.mouseInterctionCamera.update();

        // fov値を決める
        let fov = 60 * this.mouseInterctionCamera.fovScale;

        // ビューからクリップ座標系に変換する行列
        // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
        let mProjection = createPerspectiveMatrix4x4FromRighthandCoordinate(
            fov,
            webGL_data_container.canvas.width,
            webGL_data_container.canvas.height,
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

        // uniformに渡す行列データを更新
        const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
        mvp_mtx_uniform_data.datas = this.mat.m;
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        const webGL_data_container = this.webGL_data_container;

        // シェーダー更新
        let shader_frame = webGL_data_container.getShaderFrame(this.shader_frame_name);
        // シェーダー有効化
        shader_frame.use();
        // VBO And IDO更新
        shader_frame.updateVertexAttributeAndIndexBuffer();

        // Uniformロケーションにデータ設定
        {
            const color_uniform_data = this.uniform_datas.global_color;
            shader_frame.setUniformData(color_uniform_data.name, color_uniform_data.datas);

            const texture_unity_uniform_data = this.uniform_datas.texture_unit;
            shader_frame.setUniformData(texture_unity_uniform_data.name, texture_unity_uniform_data.datas);
        }

        {
            let move_mat = createTranslationMatrix4x4(new Vector3(1.0, 0.0, 0.0));
            this.mat.mul(move_mat);

            const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
            shader_frame.setUniformData(mvp_mtx_uniform_data.name, this.mat.m);
        }

        {
            const texture_frame = this.webGL_data_container.getTexture(this.texture_2_name);
            // ロードしたテクスチャを有効化
            texture_frame.enableBindTexture(true);
        }

        // 転送情報を使用して頂点を画面にレンダリング
        // 第三引数に頂点数を渡している
        if (this.is_face === false) {
            const vbo_positions = this.vbo_datas.positions;
            gl.drawArrays(gl.POINTS, 0, vbo_positions.datas.length / vbo_positions.stride_count);
        }
        else {
            // インデックスバッファで描画
            gl.drawElements(gl.TRIANGLES, this.ido_buffer_data.length, gl.UNSIGNED_SHORT, 0);
        }

        {
            const texture_frame = this.webGL_data_container.getTexture(this.texture_name);
            // ロードしたテクスチャを有効化
            texture_frame.enableBindTexture(true);
        }

        {
            let move_mat = createTranslationMatrix4x4(new Vector3(-2.0, 0.0, 0.0));
            this.mat.mul(move_mat);

            const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
            shader_frame.setUniformData(mvp_mtx_uniform_data.name, this.mat.m);
        }

        // 転送情報を使用して頂点を画面にレンダリング
        // 第三引数に頂点数を渡している
        if (this.is_face === false) {
            const vbo_positions = this.vbo_datas.positions;
            gl.drawArrays(gl.POINTS, 0, vbo_positions.datas.length / vbo_positions.stride_count);
        }
        else {
            // インデックスバッファで描画
            gl.drawElements(gl.TRIANGLES, this.ido_buffer_data.length, gl.UNSIGNED_SHORT, 0);
        }


    }
}