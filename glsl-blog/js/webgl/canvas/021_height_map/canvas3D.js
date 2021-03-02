/**
 * ハイトマップテクスチャを利用したテクスチャの立体表示
 */
class height_map extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'hide_map';
        this.base_texture_name = 'base_texture';
        this.height_texture_name = 'height_texture';

        this.mouse_scale = 0.05;

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

                texcoords: {
                    name: 'texCoord',
                    stride_count: 2,
                    datas: [
                        // 頂点左上 / テクスチャ座標左下
                        0.0, 0.0,
                        // 頂点右上 / テクスチャ座標右下
                        1.0, 0.0,
                        // 頂点右下 / テクスチャ座標右上
                        1.0, 1.0,
                        // 頂点左下 / テクスチャ座標左上
                        0.0, 1.0,
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
            image_texture: {
                name: 'imageTexture',
                type: 'uniform1i',
                datas: 0,
            },
            hideMapTexture: {
                name: 'hideMapTexture',
                type: 'uniform1i',
                datas: 1,
            },
            mouse: {
                name: 'mouse',
                type: 'uniform2fv',
                datas: [0.0, 0.0],
            },
            mouse_scale: {
                name: 'mouseScale',
                type: 'uniform1f',
                datas: 0.0
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
        const promise_base_texture = this.webGL_data_container.createTextures(
            this.base_texture_name,
            0,
            this.data_file_path + '/base.png'
        ); 
        const promise_height_texture = this.webGL_data_container.createTextures(
            this.height_texture_name,
            1,
            this.data_file_path + '/height.png'
        ); 

        return new Promise((reslove) => {
            Promise.all([
                promise_shader,
                promise_base_texture,
                promise_height_texture
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

        const base_texture = webGL_data_container.getTexture(this.base_texture_name);
        const height_texture = webGL_data_container.getTexture(this.height_texture_name);

        base_texture.enableBindTexture(true);
        height_texture.enableBindTexture(true);

        // Uniformロケーションにデータ設定
        {
            const mouse_uniform_data = this.uniform_datas.mouse;
            shader_frame.setUniformData(mouse_uniform_data.name, mouse_uniform_data.datas);

            const mouse_scale_uniform_data = this.uniform_datas.mouse_scale
            mouse_scale_uniform_data.datas = this.mouse_scale;
            shader_frame.setUniformData(mouse_scale_uniform_data.name, mouse_scale_uniform_data.datas);
        }

        gl.drawElements(gl.TRIANGLES, this.ido_buffer_data.length, gl.UNSIGNED_SHORT, 0);

        base_texture.enableBindTexture(false);
        height_texture.enableBindTexture(false);
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