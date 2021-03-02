/**
 * フレームバッファを使ってポストエフェクトを実現
 * 画面には1枚絵のみを表示
 * このクラスはポストエフェクトの動きを試すためのテスト用にすぎない
 * シェーダーの属性名はクラス内で固定指定している
 * ロードするシェーダーファイル名も固定指定
 * 使う上でのルールが厳密なので注意
 * 用意するファイルは以下になる
 * vs1.vert / fs1.frag => メッシュ描画シェーダーファイル
 * vs2.vert / fs2.frag => ポストエフェクトシェーダーファイル
 * sample01.jpg => メッシュ描画用のテクスチャファイル
 */
class FramebufferTemplateCanvas3D extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'framebuffer';
        this.post_effect_shader_frame_name = 'post_effect';

        // 3Dカメラの制御
        this.mouse_interction_camera = CameraController.createMouseInterction();
        this.mouse_interction_camera.setup(webGL_data_container.canvas);

        // 座標変換行列作成
        {
            // ワールドからビュー座標系に変換する行列
            // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));
            this.mat = new Matrix4x4();
        }

        // 表示するメッシュデータを作成
        this.draw_mesh_data = this._createMeshData();
        this.post_effect_mesh_data = this._createPostEffectMeshData();

        // ポストプロセス用のレンダーテクスチャーを作成
        this.render_texture_name = 'render_texture';
        this.webGL_data_container.createRenderTexture(
            this.render_texture_name,
            this.post_effect_mesh_data.uniform_datas.texture_unit_01.datas,
            this.webGL_data_container.canvas.width,
            this.webGL_data_container.canvas.height);
    }

    getPostEffectUniformDatas() {
        return this.post_effect_mesh_data.uniform_datas;
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

            // シェーダーをロード
            let load_post_effect_shader_promise = data_container.createShaderFrame(
                this.post_effect_shader_frame_name,
                this.data_file_path + '/vs2.vert',
                this.data_file_path + '/fs2.frag');

            // テクスチャをロード
            const uniform_datas = this.draw_mesh_data.uniform_datas;
            let load_texture01_promise = data_container.createTextures(
                uniform_datas.texture_unit_01.name,
                uniform_datas.texture_unit_01.datas,
                this.data_file_path + '/sample01.jpg');

            Promise.all(
                [
                    load_shader_promise,
                    load_post_effect_shader_promise,
                    load_texture01_promise,
                ])
                .then((load_results) => {

                    this._setupShader(load_results[0], this.draw_mesh_data);
                    this._setupShader(load_results[1], this.post_effect_mesh_data);

                    // ロードしたテクスチャを有効化
                    {
                        const texture01_frame = load_results[2];
                        texture01_frame.enableBindTexture(true);
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

        common_module.freeObject(this.draw_mesh_data);
        this.draw_mesh_data = null;

        common_module.freeObject(this.post_effect_mesh_data);
        this.post_effect_mesh_data = null;
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
        const mvp_mtx_uniform_data = this.draw_mesh_data.uniform_datas.mvp_mtx;
        mvp_mtx_uniform_data.datas = this.mat.m;
    }

    /**
     * 描画前処理
     * オフスクリーンレンダリングができる
     */
    beginRender(gl, render_data) {
        const webGL_data_container = this.webGL_data_container;
        const render_texture = webGL_data_container.getRenderTexture(this.render_texture_name);

        // ウィンドウがリサイズしたのでレンダーテクスチャーを作りなおす
        if (render_data.window_resize_flag) {
            render_texture.resize(render_data.window_width, render_data.window_height);
        }

        // TODO: オフスクリーン描画をする
        render_texture.writeRendering(() => {
            // シェーダー更新
            const shader_frame = webGL_data_container.getShaderFrame(this.shader_frame_name);
            // シェーダー有効化
            shader_frame.use();
            // VBO And IDO更新
            shader_frame.updateVertexAttributeAndIndexBuffer();

            // Uniformロケーションにデータ設定
            const draw_mesh_data = this.draw_mesh_data;

            {
                const uniform_datas = draw_mesh_data.uniform_datas;

                const color_uniform_data = uniform_datas.global_color;
                shader_frame.setUniformData(color_uniform_data.name, color_uniform_data.datas);

                const mvp_mtx_uniform_data = uniform_datas.mvp_mtx;
                shader_frame.setUniformData(mvp_mtx_uniform_data.name, mvp_mtx_uniform_data.datas);

                const texture_unit_01_uniform_data = uniform_datas.texture_unit_01;
                const texture = webGL_data_container.getTexture(texture_unit_01_uniform_data.name);
                texture.enableBindTexture(true);

                shader_frame.setUniformData(texture_unit_01_uniform_data.name, texture_unit_01_uniform_data.datas);
            }

            // 転送情報を使用して頂点を画面にレンダリング
            gl.drawElements(gl.TRIANGLES, this.draw_mesh_data.ido_data.datas.length, gl.UNSIGNED_SHORT, 0);
        });
    }

    /**
     * 描画
     */
    render(gl, render_data) {
        const webGL_data_container = this.webGL_data_container;

        const render_texture = webGL_data_container.getRenderTexture(this.render_texture_name);
        render_texture.begin();
        {
            // ポストエフェクト描画をする
            // レンダーテクスチャーを利用してポストエフェクトの描画をする
            // シェーダー更新
            let shader_frame = webGL_data_container.getShaderFrame(this.post_effect_shader_frame_name);
            // シェーダー有効化
            shader_frame.use();
            // VBO And IDO更新
            shader_frame.updateVertexAttributeAndIndexBuffer();

            // Uniformロケーションにデータ設定
            const mesh_data = this.post_effect_mesh_data;
            {
                const uniform_datas = mesh_data.uniform_datas;

                // 経過時間と画面サイズを渡す
                uniform_datas.time.datas = render_data.time;
                uniform_datas.resolution.datas = [render_data.window_width, render_data.window_height];

                for (let key in uniform_datas) {
                    const uniform_data = uniform_datas[key];
                    shader_frame.setUniformData(uniform_data.name, uniform_data.datas);
                }
            }

            // 転送情報を使用して頂点を画面にレンダリング
            gl.drawElements(gl.TRIANGLES, mesh_data.ido_data.datas.length, gl.UNSIGNED_SHORT, 0);

        }
        render_texture.end();
    }

    /**
     * メッシュデータ作成
     */
    _createMeshData() {
        // VBO And IBO作成する情報リスト
        let mesh_data = {
            vbo_datas: {
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
            },

            ido_data: {
                name: 'drawMeshIndex',
                datas: []
            },

            // uniformを作成するデータ
            uniform_datas: {
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
            },
        };

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
                mesh_data.vbo_datas.positions.datas.push(x, y, 0.0);

                // 頂点色
                mesh_data.vbo_datas.colors.datas.push(1.0, 1.0, 1.0, 1.0);

                // 頂点インデックス追加
                if (i > 0 && j > 0) {
                    let first_base_index = (i - 1) * (VERTEX_COUNT + 1) + j;
                    let second_base_index = (i) * (VERTEX_COUNT + 1) + j;

                    mesh_data.ido_data.datas.push(
                        first_base_index - 1, first_base_index, second_base_index - 1,
                        second_base_index - 1, first_base_index, second_base_index,
                    );
                }

                mesh_data.vbo_datas.texcoords.datas.push(
                    (i / VERTEX_COUNT), 1.0 - (j / VERTEX_COUNT),
                );
            }
        }

        return mesh_data;
    }

    /**
     * ポストエフェクト用のメッシュデータ
     */
    _createPostEffectMeshData() {
        // VBO And IBO作成する情報リスト
        let mesh_data = {
            vbo_datas: {
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
            },

            ido_data: {
                name: 'postEffectMeshIndex',
                datas: [
                    0, 1, 3,
                    1, 2, 3
                ]
            },

            // uniformを作成するデータ
            uniform_datas: {
                texture_unit_01: {
                    name: 'textureUnit01',
                    type: 'uniform1i',
                    datas: 1
                },

                time: {
                    name: 'time',
                    type: 'uniform1f',
                    datas: 0
                },

                resolution: {
                    name: 'resolution',
                    type: 'uniform2fv',
                    datas: []
                },
            },
        };

        return mesh_data;
    }

    /**
     * メッシュデータに従ってシェーダーを設定
     */
    _setupShader(shader_frame, mesh_data) {
        const vbo_datas = mesh_data.vbo_datas;
        const ido_data = mesh_data.ido_data;
        const uniform_datas = mesh_data.uniform_datas;

        // vboを作成
        for (let key in vbo_datas) {
            let location = vbo_datas[key];

            shader_frame.createVBOAttributeData(
                location.name,
                location.stride_count,
                location.datas);
        };

        // idoを作成
        shader_frame.createIndexBufferObject(ido_data.name, ido_data.datas);

        // uniform作成
        for (let key in uniform_datas) {
            const uniform_data = uniform_datas[key];
            shader_frame.createUniformObject(uniform_data.name, uniform_data.type);
        }
    }
}
