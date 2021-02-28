/**
 * 頂点カラーを表示するキャンバス
 */
class vertex_color extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'vertex_color';

        // VBO作成する情報リスト
        this.vbo_datas = {
            positions: {
                name: 'position',
                stride_count: 3,
                datas: [
                    // 1つ目の点
                    0.0, -0.3, 0.0,
                    // 2つ目の点
                    0.0, 0.3, 0.0
                ],
            },

            colors: {
                name: 'color',
                stride_count: 4,
                datas: [
                    // 1つ目の点
                    1, 0, 0, 1,
                    // 2つ目の点
                    0, 0, 1, 1,
                ],
            }
        };

        // uniformを作成するデータ
        this.uniform_datas = {
            global_color: {
                name: 'globalColor',
                type: 'uniform4fv',
                datas: [1, 1, 1, 1],
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
                const uniform_data = this.uniform_datas.global_color;
                shader_frame.createUniformObject(uniform_data.name, uniform_data.type);

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
        this.vbo_datas= null;

        common_module.freeObject(this.uniform_datas);
        this.uniform_datas = null;
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        let shader_frame = this.webGL_data_container.getShaderFrame(this.shader_frame_name);

        // シェーダー有効化
        shader_frame.use();

        // VBO更新
        shader_frame.updateVertexAttribute();
        // Uniformロケーションにデータ設定
        const uniform_data = this.uniform_datas.global_color;
        shader_frame.setUniformData(uniform_data.name, uniform_data.datas);

        // 描画実行
        const positions = this.vbo_datas.positions;

        // ポイントスプライトなので第3引数に表示する点の数を指定
        gl.drawArrays(gl.POINTS, 0, positions.datas.length / positions.stride_count);
    }

}