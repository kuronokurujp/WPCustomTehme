/**
 * WebGL2.0の機能「TransformFeedback」を利用する
 * シェーダーで書き込んだ情報を出力して頂点座標を更新する
 */
"use strict";

class transform_feedback extends Canvas3D {
    /**
     * コンストラクタ
     */
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        // 変数の初期化
        {
            this.transform_feedback_shader_name = 'tranform_feedback';
            this.render_shader_name = 'render';
            this.composite_shader_name = 'composite_shader';
            this.mouse = [0.0, 0.0];

            this.parame_pane = null;

            // シェーダーが出力する変数名
            this.output_varying_names = [
                'vPosition',
                'vVelocity'
            ];
        }

        // パラメータ調整GUI生成
        {
            let pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });
            }
        }

        // TransformFeedbackデータ準備
        // TransformFeedbackの描画頂点数とRenderの描画頂点数は一致しないとだめ
        {
            // VBO
            {
                this.transform_feedback_vbo_datas = {
                    positions: {
                        name: 'position',
                        render_define: true,
                        stride_count: 3,
                        datas: []
                    },
                    velocity: {
                        name: 'velocity',
                        render_define: false,
                        stride_count: 3,
                        datas: []
                    },
                    random: {
                        name: 'random',
                        stride_count: 1,
                        datas: []
                    }
                };

                // 頂点座標を作成
                {
                    const VERTEX_COUNT = 128;

                    const vbo_datas = this.transform_feedback_vbo_datas;
                    // 正規化デバイス座標系を基準に座標作成
                    for (let x = 0; x <= VERTEX_COUNT; ++x) {

                        const x_pos = 2.0 * (x / VERTEX_COUNT) - 1.0;
                        for (let y = 0; y <= VERTEX_COUNT; ++y) {

                            const y_pos = 2.0 * (y / VERTEX_COUNT) - 1.0;
                            vbo_datas.positions.datas.push(x_pos, y_pos, 0.0);
                            vbo_datas.velocity.datas.push(0.0, 0.0, 0.0);
                            vbo_datas.random.datas.push(RandomRange(-0.5, 0.5));
                        }
                    }
                }
            }

            // uniform定義データ
            {
                // uniformを作成するデータ
                this.transform_feedback_uniform_datas = {
                    time: {
                        name: 'time',
                        type: 'uniform1f',
                        datas: 0.0,
                    },
                    mouse: {
                        name: 'mouse',
                        type: 'uniform2fv',
                        datas: [0.0, 0.0],
                    },
                };
            }
        }

        // レンダリングデータの準備
        {
            // VBO作成する情報リスト
            {
                this.vbo_datas = {
                };

                // transform_feedbackのを追加
                for (let key in this.transform_feedback_vbo_datas) {
                    const v = this.transform_feedback_vbo_datas[key];
                    if (!v.render_define)
                        continue;

                    this.vbo_datas[key] =
                    {
                        name: v.name,
                        stride_count: v.stride_count,
                        datas: null
                    };
                }
            }

            // uniformを作成するデータ
            this.uniform_datas = {
                mvp_mtx: {
                    name: 'mvpMatrix',
                    type: 'uniformMatrix4fv',
                    datas: null,
                },
            };
        }

        // 3Dカメラ生成
        {
            this.mouseInterctionCamera = CameraController.createMouseInterction();

            const camera = this.mouseInterctionCamera;
            camera.setup(webGL_data_container.canvas);
        }

        // オブジェクトの座標変換行列生成
        {
            this.mWorld = new Matrix4x4();
            this.mWorld.mul(createTranslationMatrix4x4(new Vector3(0.0, 0.0, 0.0)));

            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));

            this.mat = new Matrix4x4();
        }
    }

    /**
     * 破棄
     */
    dispose() {
        if (this.parame_pane != null) {
            this.parame_pane.dispose();
            common_module.freeObject(this.parame_pane);
        }
        this.parame_pane = null;
    }

    /**
     * ロード
     */
    load() {
        return new Promise((reslove, reject) => {
            // TransformFeedback用のシェーダーを作成
            const transform_feedback_shader_frame = this.webGL_data_container.createShaderFrameAndTransformFeedback(
                this.transform_feedback_shader_name,
                this.data_file_path + '/transform_feedback.vert',
                this.data_file_path + '/transform_feedback.frag',
                this.output_varying_names,
            );

            // Render用のシェーダーを作成
            const render_shader_frame = this.webGL_data_container.createShaderFrame(
                this.render_shader_name,
                this.data_file_path + '/vs1.vert',
                this.data_file_path + '/fs1.frag',
            );

            Promise.all([
                transform_feedback_shader_frame,
                render_shader_frame,
            ]).then((load_result) => {

                // TransformFeedback使用準備
                {
                    let transform_feedback_shader_frame = load_result[0];
                    for (let key in this.transform_feedback_vbo_datas) {
                        const vbo_data = this.transform_feedback_vbo_datas[key];

                        transform_feedback_shader_frame.createVBOAttributeData(
                            vbo_data.name,
                            vbo_data.stride_count,
                            vbo_data.datas
                        );
                    }

                    for (let key in this.transform_feedback_uniform_datas) {
                        const uniform_data = this.transform_feedback_uniform_datas[key];

                        transform_feedback_shader_frame.createUniformObject(
                            key,
                            uniform_data.type
                        );
                    }
                }

                // RenderShaderの設定
                {
                    let render_shader_frame = load_result[1];
                    for (let key in this.vbo_datas) {
                        const vbo_data = this.vbo_datas[key];

                        render_shader_frame.createVBOAttributeData(
                            vbo_data.name,
                            vbo_data.stride_count,
                            vbo_data.datas
                        );
                    }

                    for (let key in this.uniform_datas) {
                        const uniform_data = this.uniform_datas[key];
                        render_shader_frame.createUniformObject(
                            uniform_data.name,
                            uniform_data.type,
                        );
                    }
                }

                // TransformFeedbackとRenderのShader連携したShaderを生成
                {
                    this.webGL_data_container.createShaderFrameComposite(
                        this.composite_shader_name,
                        // render shader
                        [
                            {
                                priority: 0,
                                shader_name: this.render_shader_name,
                            }
                        ],
                        // transform feedback shader
                        [
                            {
                                priority: 0,
                                shader_name: this.transform_feedback_shader_name,
                            }
                        ],
                    );
                }

                reslove();
            }).catch((ex) => {
            });
        });
    }

    update(time) {
        const webGL_data_container = this.webGL_data_container;

        // fov値を決める
        // 値が大きくなるほどカメラの見える範囲が大きくなるので縮小しているようになる
        let fov = 60;

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

        // 射影行列 * ビュー行列 * マウス行列 * モデル行列
        this.mat.mul(this.mWorld);

    }

    /**

     * 描画
     */
    render(gl, render_data) {

        const primitive_mode = gl.POINTS;
        const shader_composite_frame = this.webGL_data_container.getCompositeShaderFrame(this.composite_shader_name);
        shader_composite_frame.execute(
            primitive_mode,
            // TransformFeedback
            (primitive_mode, transform_feedback_shader_frame) => {

                this.transform_feedback_uniform_datas.mouse.datas = this.mouse;

                for (let key in this.transform_feedback_uniform_datas) {
                    const uniform_data = this.transform_feedback_uniform_datas[key];
                    transform_feedback_shader_frame.setUniformData(uniform_data.name, uniform_data.datas);
                }

                const vbo = this.transform_feedback_vbo_datas.positions;
                // 描画する頂点分シェーダーを実行する
                // そうしないと描画頂点それぞれにデータが反映しない
                gl.drawArrays(primitive_mode, 0, vbo.datas.length / vbo.stride_count);
            },
            // Render
            (primitive_mode, render_shader_frame) => {
                // 点描画
                const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
                mvp_mtx_uniform_data.datas = this.mat.m;

                for (let key in this.uniform_datas) {
                    const uniform_data = this.uniform_datas[key];
                    render_shader_frame.setUniformData(uniform_data.name, uniform_data.datas);
                }

                const vbo_positions = this.transform_feedback_vbo_datas.positions;
                gl.drawArrays(primitive_mode, 0, vbo_positions.datas.length / vbo_positions.stride_count);
            });
    }

    /**
     * マウス移動した場合に呼び出されるアクション
     * マウス座標は正規化デバイス座標系として引数から受け取れる
     */
    actionMoveMouse(xNDC, yNDC) {
        this.mouse = [xNDC, yNDC];
    }
}