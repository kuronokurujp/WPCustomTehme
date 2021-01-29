/**
 * ひな型
 */
class default_canvas3D extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        // VBO And IBO作成する情報リスト
        {
            this.vbo_datas = {
                positions: {
                    name: 'position',
                    stride_count: 3,
                    datas: [
                        // 左上
                        -1.0, 1.0, 0.0,
                        // 右上
                        1.0, 1.0, 0.0,
                        // 右下
                        1.0, -1.0, 0.0,
                        // 左下
                        -1.0, -1.0, 0.0,
                    ],
                },
            };

            this.ido_buffer_data = [
                0, 1, 3,
                1, 2, 3
            ];
        }

        // uniformを作成するデータ
        this.uniform_datas = {
            time: {
                name: 'time',
                type: 'uniform1f',
                datas: 0.0,
            },
            resolution: {
                name: 'resolution',
                type: 'uniform2fv',
                datas: [0.0, 0.0],
            },
            mouse: {
                name: 'mouse',
                type: 'uniform2fv',
                datas: [0.0, 0.0],
            },
        };
    }

    /**
     * ロード
     */
    load() {
        const promise_shader = this.webGL_data_container.createShaderFrame(
            this.shader_frame_name,
            this.data_file_path + '/vs1.vert',
            this.data_file_path + '/fs1.frag');

        return new Promise((reslove) => {
            Promise.all([
                promise_shader,
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

        common_module.freeObject(this.vbo_datas);
        this.vbo_datas = null;

        common_module.freeObject(this.uniform_datas);
        this.uniform_datas = null;

        common_module.freeObject(this.ido_buffer_data);
        this.ido_buffer_data = null;
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
            const mouse_uniform_data = this.uniform_datas.mouse;
            shader_frame.setUniformData(mouse_uniform_data.name, mouse_uniform_data.datas);

            const time_uniform_data = this.uniform_datas.time;
            shader_frame.setUniformData(time_uniform_data.name, render_data.time);

            const resolution_uniform_data = this.uniform_datas.resolution;
            resolution_uniform_data.datas = [render_data.window_width, render_data.window_height];
            shader_frame.setUniformData(resolution_uniform_data.name, resolution_uniform_data.datas);
        }

        gl.drawElements(gl.TRIANGLES, this.ido_buffer_data.length, gl.UNSIGNED_SHORT, 0);
    }

    /**
     * マウス移動した場合に呼び出されるアクション
     * マウス座標は正規化デバイス座標系として引数から受け取れる
     */
    actionMoveMouse(xNDC, yNDC) {
        const mouse_uniform_data = this.uniform_datas.mouse;
        mouse_uniform_data.datas = [xNDC, yNDC];
    }
}