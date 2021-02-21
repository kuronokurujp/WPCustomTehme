/**
    VTF(Vertex Transform Feach)
    テクスチャに浮動小数点値を書き込んでGPGPU計算したカーリノイズの演出
    作成中
 */
class curl_noize extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        // レンダリングするシェーダーのデータ構築
        this.data_size_width = 0;
        this.data_size_height = 0;
        {
            this.vbo_datas = {
                positions: {
                    name: 'position',
                    stride_count: 3,
                    datas: [
                        // 左上
                        -0.5, 0.5, 0.0,
                        // 右上
                        0.5, 0.5, 0.0,
                        // 右下
                        0.5, -0.5, 0.0,
                        // 左下
                        -0.5, -0.5, 0.0,
                    ],
                },
                tex_coord: {
                    name: 'texCoord',
                    stride_count: 2,
                    datas: [
                        // 左上
                        0.0, 1.0,
                        // 右上
                        1.0, 1.0,
                        // 右下
                        1.0, 0.0,
                        // 左下
                        0.0, 0.0,
                    ]
                }
            };

            // uniformを作成するデータ
            this.uniform_datas = {
                position_data_texture_slot: {
                    name: 'dataTextureUnit',
                    type: 'uniform1i',
                    slot: 0,
                },
            };

            this.render_shader_frame_name = 'render';

            this.data_size_width = this.vbo_datas.positions.datas.length / 2;
            this.data_size_height = this.vbo_datas.positions.datas.length / 2;
        }

        // 座標データを持つVTF
        this.vtf_position_offset_frame_name = 'position_offset';

        this.composite_shader_frame_name = 'composite_shader';
    }

    /**
     * 非同期ロード
     */
    load() {
        // 描画用シェーダー作成
        const render_shader = this.webGL_data_container.createShaderFrame(
            this.render_shader_frame_name,
            this.data_file_path + '/vs.vert',
            this.data_file_path + '/fs.frag');

        // VTF用シェーダー作成
        const vtf_position_offset_shader = this.webGL_data_container.createShaderVtfFrame(
            this.vtf_position_offset_frame_name,
            this.data_file_path + '/base.vert',
            this.data_file_path + '/reset.frag',
            this.data_file_path + '/base.vert',
            this.data_file_path + '/position.frag',
            this.data_size_width, this.data_size_height,
            0, 1);

        return new Promise((reslove) => {
            Promise.all([
                render_shader,
                vtf_position_offset_shader,
            ]).then((load_results) => {
                const render_shader_frame = load_results[0];
                // レンダリングするシェーダーのデータ設定
                {
                    // vboを作成
                    for (let key in this.vbo_datas) {
                        let location = this.vbo_datas[key];
                        render_shader_frame.createVBOAttributeData(
                            location.name,
                            location.stride_count,
                            location.datas);
                    };

                    // uniformを作成
                    for (let key in this.uniform_datas) {
                        const uniform_data = this.uniform_datas[key];
                        render_shader_frame.createUniformObject(
                            uniform_data.name,
                            uniform_data.type
                        );
                    }
                }

                // TODO: データシェーダーにUniformを追加設定する
                {

                }

                // 複数のシェーダーをコンポジット
                this.webGL_data_container.createShaderFrameComposite(
                    this.composite_shader_frame_name,
                    [{ priority: 0, shader_name: this.render_shader_frame_name }],
                    [],
                    [{ priority: 0, shader_name: this.vtf_position_offset_frame_name }],
                );

                reslove();
            });
        });
    }

    /**
     * メモリやオブジェクトの解放
     * キャンバス内で生成したシェーダーフレームやテクスチャフレームなどは解放しなくて良い
     * キャンバス切り替えで一括解放しているから
     */
    dispose() {
    }

    /**
     * 更新
     */
    update(time) {
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        const webGL_data_container = this.webGL_data_container;

        // シェーダー更新
        /*
        let render_shader_frame = webGL_data_container.getShaderFrame(this.render_shader_frame_name);
        render_shader_frame.beginProcess();
        // 描画実行
        {
            const vbo_position = this.vbo_datas.positions;
            gl.drawArrays(gl.POINTS, 0, vbo_position.datas.length / vbo_position.stride_count);
        }
        render_shader_frame.endProcess();
        */

        // コンポジットしたシェーダーを使って描画実行
        let shader_frame = webGL_data_container.getCompositeShaderFrame(this.composite_shader_frame_name);
        shader_frame.execute(
            gl.POINTS,
            null,
            (private_mode, shader, use_texture_slots) => {
                // TODO: 使用しているテクスチャスロットをUniformで渡す
                {
                    for (let key in this.uniform_datas) {
                        const texture_uniform_data = this.uniform_datas[key];
                        use_texture_slots.forEach(element => {
                            if (texture_uniform_data.slot == element)
                                shader.setUniformData(texture_uniform_data.name, element);
                            // MEMO: 見つからなかった場合はエラーにしない
                        });
                    }
                }

                const vbo_position = this.vbo_datas.positions;
                gl.drawArrays(private_mode, 0, vbo_position.datas.length / vbo_position.stride_count);
            });
    }
}