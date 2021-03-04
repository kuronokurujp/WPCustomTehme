/**
 VTF(Vertex Transform Feach)
 テクスチャに浮動小数点値を書き込んでGPGPU計算したカールノイズの演出
 作成中
 */
class curl_noize extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        // 座標変換行列作成
        {
            // ローカルからワールド座標系に変換する行列
            this.mWorld = new Matrix4x4();
            this.mWorld.mul(createTranslationMatrix4x4(new Vector3(0.0, 0.0, 0.0)));

            // ワールドからビュー座標系に変換する行列
            // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));

            this.mat = new Matrix4x4();
        }

        // レンダリングするシェーダーのデータ構築
        this.data_size_width = 256;
        this.data_size_height = this.data_size_width;
        {
            this.vbo_datas = {
                tex_coord: {
                    name: 'texCoord',
                    stride_count: 2,
                    datas: []
                }
            };

            // tex_coordを設定
            {
                for (let y = 0; y < this.data_size_height; ++y) {
                    const tex_coord_y = y / this.data_size_height;
                    for (let x = 0; x < this.data_size_width; ++x) {
                        const tex_coord_x = x / this.data_size_width;
                        this.vbo_datas.tex_coord.datas.push(tex_coord_x, tex_coord_y);
                    }
                }
            }

            // uniformを作成するデータ
            this.uniform_datas = {
                position_data_texture_slot: {
                    name: 'positionTextureUnit',
                    type: 'uniform1i',
                    datas: 0,
                },
                velocity_data_texture_slot: {
                    name: 'velocityTextureUnit',
                    type: 'uniform1i',
                    datas: 0,
                },
                mvp_mtx: {
                    name: 'mvp_mat',
                    type: 'uniformMatrix4fv',
                    datas: null,
                }
            };

            this.render_shader_frame_name = 'render';
        }

        // positionシェーダーのuniform
        {
            // uniformを作成するデータ
            this.position_uniform_datas = {
                velocity_data_texture_slot: {
                    name: 'velocityTextureUnit',
                    type: 'uniform1i',
                    datas: 0,
                },
            };
        }

        // velocityシェーダーのuniform
        {
            // uniformを作成するデータ
            this.velocity_uniform_datas = {
                position_data_texture_slot: {
                    name: 'positionTextureUnit',
                    type: 'uniform1i',
                    datas: 0,
                },
            };
        }

        // 座標データを持つVTF
        this.vtf_position_frame_name = 'position';
        // 速度データを持つVTF
        this.vtf_velocity_frame_name = 'velocity';

        // 複数のシェーダーを持つコンポジットシェーダー
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
        // 座標
        const vtf_position_shader = this.webGL_data_container.createShaderVtfFrame(
            this.vtf_position_frame_name,
            this.data_file_path + '/base.vert',
            this.data_file_path + '/reset.frag',
            this.data_file_path + '/base.vert',
            this.data_file_path + '/position.frag',
            this.data_size_width, this.data_size_height,
            0, 1);

        // 速度
        const vtf_velocity_shader = this.webGL_data_container.createShaderVtfFrame(
            this.vtf_velocity_frame_name,
            this.data_file_path + '/base.vert',
            this.data_file_path + '/reset.frag',
            this.data_file_path + '/base.vert',
            this.data_file_path + '/velocity.frag',
            this.data_size_width, this.data_size_height,
            2, 3);

        return new Promise((reslove) => {
            Promise.all([
                render_shader,
                vtf_position_shader,
                vtf_velocity_shader,
            ]).then((load_results) => {
                const render_shader_frame = load_results[0];
                const vtf_position_shader_frame = load_results[1];
                const vtf_velocity_shader_frame = load_results[2];

                // レンダリングするシェーダーのデータ設定
                {
                    // vboを作成
                    for (let key in this.vbo_datas) {
                        let location = this.vbo_datas[key];
                        render_shader_frame.createVBOAttributeData(
                            location.name,
                            location.stride_count,
                            location.datas);
                    }

                    // uniformを作成
                    for (let key in this.uniform_datas) {
                        const uniform_data = this.uniform_datas[key];
                        render_shader_frame.createUniformObject(
                            uniform_data.name,
                            uniform_data.type
                        );
                    }
                }

                // positionシェーダーのuniform作成
                {
                    for (let key in this.position_uniform_datas) {
                        const uniform_data = this.position_uniform_datas[key];
                        vtf_position_shader_frame.createUniformDataToUpdateShader(
                            uniform_data.name,
                            uniform_data.type
                        )
                    }
                }

                // velocityシェーダーのuniform作成
                {
                    for (let key in this.velocity_uniform_datas) {
                        const uniform_data = this.velocity_uniform_datas[key];
                        vtf_velocity_shader_frame.createUniformDataToUpdateShader(
                            uniform_data.name,
                            uniform_data.type
                        )
                    }
                }

                // 複数のシェーダーをコンポジット
                this.webGL_data_container.createShaderFrameComposite(
                    this.composite_shader_frame_name,
                    [{priority: 0, shader_name: this.render_shader_frame_name}],
                    [],
                    [
                        // 速度の計算を元に座標の計算をする
                        {
                            priority: 1,
                            shader_name: this.vtf_position_frame_name
                        },
                        // 速度の計算から始めに行う
                        {
                            priority: 0,
                            shader_name: this.vtf_velocity_frame_name
                        }],
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
        const webGL_data_container = this.webGL_data_container;

        // fov値を決める
        let fov = 60.0;

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

        // 射影行列 * ビュー行列 * モデル行列
        this.mat.mul(this.mWorld);
        this.uniform_datas.mvp_mtx.datas = this.mat.m;
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        const webGL_data_container = this.webGL_data_container;

        // コンポジットしたシェーダーを使って描画実行
        let shader_frame = webGL_data_container.getCompositeShaderFrame(this.composite_shader_frame_name);
        shader_frame.execute(
            // renderするプリミティブ型を指定
            gl.POINTS,
            null,
            (private_mode, shader, use_texture_slots) => {
                // 座標データのテクスチャスロットをUniformで渡す
                {
                    const position_uniform_data = this.uniform_datas.position_data_texture_slot;
                    const position_slot = use_texture_slots[this.vtf_position_frame_name];
                    shader.setUniformData(position_uniform_data.name, position_slot);
                }

                // 速度データのテクスチャスロットをUniformで渡す
                {
                    const velocity_uniform_data = this.uniform_datas.velocity_data_texture_slot;
                    const velocity_slot = use_texture_slots[this.vtf_velocity_frame_name];
                    shader.setUniformData(velocity_uniform_data.name, velocity_slot)
                }

                // 行列設定
                {
                    const mvp_uniform_data = this.uniform_datas.mvp_mtx;
                    shader.setUniformData(mvp_uniform_data.name, mvp_uniform_data.datas);
                }

                const vbo_tex_coord = this.vbo_datas.tex_coord;
                gl.drawArrays(private_mode, 0, vbo_tex_coord.datas.length / vbo_tex_coord.stride_count);
            },
            // vtf更新前イベント
            (vtf_shader_frame) => {
                // VTFShaderに必要なuniform設定をする
                if (vtf_shader_frame.name.startsWith(this.vtf_velocity_frame_name)) {
                    // 速度シェーダーに前フレームの座標結果のテクスチャを設定
                    const vtf_position = this.webGL_data_container.getVtfShaderFrame(this.vtf_position_frame_name);
                    vtf_position.activeFrontTexture();
                    vtf_shader_frame.setUniformData(
                        this.velocity_uniform_datas.position_data_texture_slot.name,
                        vtf_position.getFrontTextureSlot());

                } else if (vtf_shader_frame.name.startsWith(this.vtf_position_frame_name)) {
                    // 座標シェーダーに速度テクスチャを設定
                    const vtf_velocity = this.webGL_data_container.getVtfShaderFrame(this.vtf_velocity_frame_name);
                    vtf_velocity.activeFrontTexture();
                    vtf_shader_frame.setUniformData(
                        this.position_uniform_datas.velocity_data_texture_slot.name,
                        vtf_velocity.getFrontTextureSlot());
                }
            });
    }
}