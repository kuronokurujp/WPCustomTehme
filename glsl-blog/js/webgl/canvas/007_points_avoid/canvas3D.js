/**
 * 頂点を敷き詰めた板を表示かつマウスが近づくと頂点が離れる
 */
class points_avoid extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'points_avoid';

        // VBO作成する情報リスト
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

                point_sizes: {
                    name: 'pointSize',
                    stride_count: 1,
                    datas: [],
                }
            };

            const VERTEX_COUNT = 30;
            const VERTEX_SIZE = 15;

            const vbo_datas = this.vbo_datas;
            for (let x = 0; x <= VERTEX_COUNT; ++x) {
                // x方向の座標を求める
                const x_pos = 2.0 * (x / VERTEX_COUNT) - 1.0;

                for (let y = 0; y <= VERTEX_COUNT; ++y) {
                    const y_pos = 2.0 * (y / VERTEX_COUNT) - 1.0;

                    vbo_datas.positions.datas.push(x_pos, y_pos, 0.0);
                    vbo_datas.colors.datas.push(x / VERTEX_COUNT, y / VERTEX_COUNT, 1, 1);
                    vbo_datas.point_sizes.datas.push(VERTEX_SIZE);
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
            mouse_position: {
                name: 'mouse',
                type: 'uniform2fv',
                datas: [0.0, 0.0]
            },
            resloution: {
                name: 'resolution',
                type: 'uniform2fv',
                datas: [0.0, 0.0]
            },
            time: {
                name: 'time',
                type: 'uniform1f',
                datas: 0.0,
            }
        };
    }

    /**
     * ロード
     */
    load() {
        return new Promise((reslove) => {
            this.webGL_data_container.createShaderFrame(
                this.shader_frame_name,
                this.data_file_path + '/vs1.vert',
                this.data_file_path + '/fs1.frag'
            ).then((shader_frame) => {

                for (let key in this.vbo_datas) {
                    let location = this.vbo_datas[key];

                    shader_frame.createVBOAttributeData(
                        location.name,
                        location.stride_count,
                        location.datas);
                };

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
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        const data_container = this.webGL_data_container;
        let shader_frame = data_container.getShaderFrame(this.shader_frame_name);

        // シェーダー有効化
        shader_frame.use();

        // VBO更新
        shader_frame.updateVertexAttribute();
        // Uniformロケーションにデータ設定
        {
            const color_uniform_data = this.uniform_datas.global_color;
            shader_frame.setUniformData(color_uniform_data.name, color_uniform_data.datas);

            const mouse_uniform_data = this.uniform_datas.mouse_position;
            shader_frame.setUniformData(mouse_uniform_data.name, mouse_uniform_data.datas);

            const resolution_uniform_data = this.uniform_datas.resloution;
            resolution_uniform_data.datas[0] = data_container.canvas.width;
            resolution_uniform_data.datas[1] = data_container.canvas.height;
            shader_frame.setUniformData(resolution_uniform_data.name, resolution_uniform_data.datas);

            const time_uniform_data = this.uniform_datas.time;
            time_uniform_data.datas = render_data.time;
            shader_frame.setUniformData(time_uniform_data.name, time_uniform_data.datas);
        }

        // 描画実行
        const positions = this.vbo_datas.positions;

        // ポイントスプライトなので第3引数に表示する点の数を指定
        gl.drawArrays(gl.POINTS, 0, positions.datas.length / positions.stride_count);
    }

    /**
     * マウス移動した場合に呼び出されるアクション
     * マウス座標は正規化デバイス座標系として引数から受け取れる
     */
    actionMoveMouse(xNDC, yNDC) {
        const mouse_uniform_data = this.uniform_datas.mouse_position;
        mouse_uniform_data.datas[0] = xNDC;
        mouse_uniform_data.datas[1] = yNDC;
    }
}