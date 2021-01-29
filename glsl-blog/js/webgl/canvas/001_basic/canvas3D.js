/**
 * ポイントスプライトを表示するキャンバス
 */
class basic extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.point_sprite_positions = [
            // 点１つ目
            0.0, 0.0, 0.0,
            // 点2つ目
            0.0, 0.5, 0.0
        ]
        // 頂点座標が3つあるので3つ区切りにする
        this.point_sprite_position_stride = 3;
    }

    /**
     * 非同期ロード
     * ここでシェーダーやテクスチャー生成する
     */
    load() {
        return new Promise((resolve) => {
            // シェーダーフレームを作成
            this.webGL_data_container.createShaderFrame('basic', this.data_file_path + '/vs1.vert', this.data_file_path + '/fs1.frag')
                .then((shader_frame) => {
                    // VBO作成
                    shader_frame.createVBOAttributeData('position', this.point_sprite_position_stride, this.point_sprite_positions);
                    // Uniform作成
                    shader_frame.createUniformObject('globalColor', 'uniform4fv');

                    resolve();
                });
        });
    }

    /**
     * メモリやオブジェクトの解放
     */
    dispose() {
        this.webGL_data_container = null;
        common_module.freeObject(this.point_sprite_positions);
        this.point_sprite_positions = null;
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        let shader_frame = this.webGL_data_container.getShaderFrame('basic');

        // シェーダー有効化
        shader_frame.use();

        // VBOとUniformを設定
        shader_frame.updateVertexAttribute();
        shader_frame.setUniformData('globalColor', [1, 1, 1, 1]);

        // 描画実行
        gl.drawArrays(gl.POINT, 0, this.point_sprite_positions.length / this.point_sprite_position_stride);
    }
}