/**
 * 2枚のテクスチャーをブレンド
 */
class mix_texture extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'mix_texture';

        // 3Dカメラの制御
        this.mouse_interction_camera = CameraController.createMouseInterction();
        this.mouse_interction_camera.setup(webGL_data_container.canvas);

        this.mix_value = 0.0;
        // パラメータ調整GUI作成
        this.parame_pane = null;
        {
            let pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });
                this.parame_pane.addInput({ mix: this.mix_value }, 'mix', { min: 0, max: 1.0 })
                    .on('change', (v) => {
                        this.mix_value = v;
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
                        let first_base_index = (i - 1) * (VERTEX_COUNT + 1) + j;
                        let second_base_index = (i) * (VERTEX_COUNT + 1) + j;

                        this.ido_buffer_data.push(
                            first_base_index - 1, first_base_index, second_base_index - 1,
                            second_base_index - 1, first_base_index, second_base_index,
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
            texture_unit_01: {
                name: 'textureUnit01',
                type: 'uniform1i',
                datas: 0
            },
            texture_unit_02: {
                name: 'textureUnit02',
                type: 'uniform1i',
                datas: 1
            },
            texture_mix_ratio: {
                name: 'ratio',
                type: 'uniform1f',
                datas: 0.0
            },
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
            let load_texture01_promise = data_container.createTextures(
                this.uniform_datas.texture_unit_01.name,
                this.uniform_datas.texture_unit_01.datas,
                this.data_file_path + '/sample01.jpg');

            let load_texture02_promise = data_container.createTextures(
                this.uniform_datas.texture_unit_02.name,
                this.uniform_datas.texture_unit_02.datas,
                this.data_file_path + '/sample02.jpg');

            Promise.all(
                [
                    load_shader_promise,
                    load_texture01_promise,
                    load_texture02_promise
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

                    // ロードしたテクスチャを有効化
                    {
                        const texture01_frame = load_results[1];
                        const texture02_frame = load_results[2];

                        texture01_frame.enableBindTexture(true);
                        texture02_frame.enableBindTexture(true);
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

        this.mouse_interction_camera.update();

        // fov値を決める
        let fov = 60 * this.mouse_interction_camera.fovScale;

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
        let quaternionMatrix4x4 = converMatrix4x4FromQuaternion(this.mouse_interction_camera.rotationQuaternion);
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

            const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
            shader_frame.setUniformData(mvp_mtx_uniform_data.name, mvp_mtx_uniform_data.datas);

            const texture_unit_01_uniform_data = this.uniform_datas.texture_unit_01;
            shader_frame.setUniformData(texture_unit_01_uniform_data.name, texture_unit_01_uniform_data.datas);

            const texture_unit_02_uniform_data = this.uniform_datas.texture_unit_02;
            shader_frame.setUniformData(texture_unit_02_uniform_data.name, texture_unit_02_uniform_data.datas);

            const texture_mix_ratio_uniform_data = this.uniform_datas.texture_mix_ratio;
            texture_mix_ratio_uniform_data.datas = this.mix_value;
            shader_frame.setUniformData(texture_mix_ratio_uniform_data.name, texture_mix_ratio_uniform_data.datas);
        }

        // 転送情報を使用して頂点を画面にレンダリング
        gl.drawElements(gl.TRIANGLES, this.ido_buffer_data.length, gl.UNSIGNED_SHORT, 0);
    }
}