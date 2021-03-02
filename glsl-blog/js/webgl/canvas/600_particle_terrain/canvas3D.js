/**
 ノイズマップのテクスチャの値を頂点の高さオフセットとして利用したパーティクルのTerrain表現
 */
class particle_terrain extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_name = 'particle_terrain';
        this.texture_names = ['noise_texture', 'point_texture'];

        // パラメータ調整GUI作成
        // uvスクロール時間のタイムスケールと頂点の高さのオフセット量
        this.parame_pane = null;
        this.time_scale = [0.05, 0.08, 0.03];
        this.distortion = [1.0, 0.5, 0.8];
        this.lightIntensity = 0.5;
        this.point_size = 4.0;
        this.depth_test = false;
        this.blend_test = false;
        {
            let pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });

                for (let i = 0; i < this.time_scale.length; ++i) {
                    this.parame_pane.addInput({ 'time_scale': this.time_scale[i] }, 'time_scale', { min: 0, max: 0.5 })
                        .on('change', (v) => {
                            this.time_scale[i] = v;
                        });

                    this.parame_pane.addInput({ 'distorition': this.distortion[i] }, 'distorition', { min: 0, max: 1.0 })
                        .on('change', (v) => {
                            this.distortion[i] = v;
                        });
                }

                this.parame_pane.addInput({ 'lightIntensity': this.lightIntensity },
                    'lightIntensity', { min: 0.0, max: 1.0 })
                    .on('change', (v) => {
                        this.lightIntensity = v;
                    });

                this.parame_pane.addInput({ 'pointSize': this.point_size },
                    'pointSize', { min: 1.0, max: 50.0 })
                    .on('change', (v) => {
                        this.point_size = v;
                    });

                this.parame_pane.addInput({ 'depth_test': this.depth_test }, 'depth_test')
                    .on('change', (v) => {
                        this.depth_test = v;
                    });

                this.parame_pane.addInput({ 'blend_test': this.blend_test }, 'blend_test')
                    .on('change', (v) => {
                        this.blend_test = v;
                    });
            }
        }

        // VBO作成する情報リスト
        {
            this.vbo_datas = {
                positions: {
                    name: 'position',
                    stride_count: 3,
                    datas: [],
                },

                texcoords: {
                    name: 'texCoord',
                    stride_count: 2,
                    datas: [],
                },
            };

            // メッシュの頂点生成
            const VERTEX_COUNT = 256;
            const VERTEX_WIDTH = 2.0;
            const vbo_datas = this.vbo_datas;
            for (let x = 0; x <= VERTEX_COUNT; ++x) {
                // x方向の座標を求める
                const x_pos = 2.0 * VERTEX_WIDTH * (x / VERTEX_COUNT) - VERTEX_WIDTH;

                for (let y = 0; y <= VERTEX_COUNT; ++y) {
                    const y_pos = 2.0 * VERTEX_WIDTH * (y / VERTEX_COUNT) - VERTEX_WIDTH;

                    // 頂点座標
                    vbo_datas.positions.datas.push(x_pos, 0.0, y_pos);
                    // 頂点のテクスチャ座標
                    vbo_datas.texcoords.datas.push(x / VERTEX_COUNT, y / VERTEX_COUNT);
                }
            }
        }

        // uniformを作成するデータ
        this.uniform_datas = {
            noise_texture: {
                name: 'noise_texture',
                type: 'uniform1i',
                datas: 0,
            },
            point_texture: {
                name: 'point_texture',
                type: 'uniform1i',
                datas: 1,
            },
            time: {
                name: 'time',
                type: 'uniform1f',
                datas: 0.0,
            },
            mvp_mtx: {
                name: 'mvpMatrix',
                type: 'uniformMatrix4fv',
                datas: null,
            },
            time_scale: {
                name: 'time_scale',
                type: 'uniform3fv',
                datas: this.time_scale,
            },
            distortion: {
                name: 'distorition',
                type: 'uniform3fv',
                datas: this.distortion,
            },
            lightIntensity: {
                name: 'lightIntensity',
                type: 'uniform1f',
                datas: this.lightIntensity,
            },
            point_size: {
                name: 'pointSize',
                type: 'uniform1f',
                datas: this.point_size,
            }
        };

        // 3Dカメラの制御
        {
            this.mouseInterctionCamera = CameraController.createMouseInterction();

            const camera = this.mouseInterctionCamera;
            camera.setup(webGL_data_container.canvas);
            camera.setFovScaleMinAndMax(0.1, 1.0);
            camera.rotateAngle([1.0, 0.0, 0.0], DegreesToRadians(-45.0));
            camera.scale(1.0);
        }

        // 座標変換する行列を作成
        {
            this.mWorld = new Matrix4x4();
            this.mWorld.mul(createTranslationMatrix4x4(new Vector3(0.0, 0.0, 0.0)));

            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));

            this.mat = new Matrix4x4();
        }
    }

    load() {
        return new Promise((reslove) => {
            const shader_frame = this.webGL_data_container.createShaderFrame(
                this.shader_name,
                this.data_file_path + '/vs1.vert',
                this.data_file_path + '/fs1.frag',
            );

            const noise_texture = this.webGL_data_container.createTextures(
                this.texture_names[0],
                this.uniform_datas.noise_texture.datas,
                this.data_file_path + '/snoise.png',
            );

            const point_texture = this.webGL_data_container.createTextures(
                this.texture_names[1],
                this.uniform_datas.point_texture.datas,
                this.data_file_path + '/point.jpg',
            );

            Promise.all([
                shader_frame,
                noise_texture,
                point_texture,
            ]).then((load_results) => {
                const shader_frame = load_results[0];

                for (const key in this.vbo_datas) {
                    const vbo_data = this.vbo_datas[key];
                    shader_frame.createVBOAttributeData(
                        vbo_data.name,
                        vbo_data.stride_count,
                        vbo_data.datas
                    );
                }

                for (const key in this.uniform_datas) {
                    const uniform_data = this.uniform_datas[key];
                    shader_frame.createUniformObject(
                        uniform_data.name,
                        uniform_data.type
                    );
                }

                reslove();
            }).catch((errors) => {
                common_module.noticeError(errors);
            }
            );
        });
    }

    dispose() {
        if (this.parame_pane != null) {
            this.parame_pane.dispose();
            common_module.freeObject(this.parame_pane);
        }
        this.parame_pane = null;

        common_module.freeObject(this.vbo_datas);
        this.vbo_datas = null;

        common_module.freeObject(this.uniform_datas);
        this.uniform_datas = null;

        common_module.freeObject(this.mouseInterctionCamera);
        this.mouseInterctionCamera = null;

        common_module.freeObject(this.mWorld);
        this.mWorld = null;

        common_module.freeObject(this.mView);
        this.mView = null;

        common_module.freeObject(this.mat);
        this.mat = null;
    }

    update(time) {
        const webGL_data_container = this.webGL_data_container;

        this.mouseInterctionCamera.update();

        // fov値を決める
        // 値が大きくなるほどカメラの見える範囲が大きくなるので縮小しているようになる
        let fov = 60 * this.mouseInterctionCamera.fovScale;

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

    render(gl, render_data) {
        // この処理共通化出来るかな
        const shader_frame = this.webGL_data_container.getShaderFrame(this.shader_name);
        const noise_texture = this.webGL_data_container.getTexture(this.texture_names[0]);
        const point_texture = this.webGL_data_container.getTexture(this.texture_names[1]);

        shader_frame.use();

        noise_texture.enableBindTexture(true);
        point_texture.enableBindTexture(true);

        shader_frame.updateVertexAttributeAndIndexBuffer();

        // uniformの更新
        {
            const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
            mvp_mtx_uniform_data.datas = this.mat.m;

            const time_uniform_data = this.uniform_datas.time;
            time_uniform_data.datas = render_data.time;

            const lightIntensity_uniform_data = this.uniform_datas.lightIntensity;
            lightIntensity_uniform_data.datas = this.lightIntensity;

            const point_size_uniform_data = this.uniform_datas.point_size;
            point_size_uniform_data.datas = this.point_size;

            for (const key in this.uniform_datas) {
                const uniform_data = this.uniform_datas[key];
                shader_frame.setUniformData(uniform_data.name, uniform_data.datas);
            }
        }

        // 深度テストを有効にする
        if (this.depth_test) {
            gl.enable(gl.DEPTH_TEST);
        }
        else {
            gl.disable(gl.DEPTH_TEST);
        }

        if (this.blend_test) {

            "use strict";
            // アルファについて以下のサイトが参考になる！
            // https://wgld.org/d/webgl/w029.html
            gl.enable(gl.BLEND);
            // 描画元の色を描画元のアルファで乗算したのを描画先の色に加算
            // つまり描画先の色が強くなる
            gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);
        }
        else {
            gl.disable(gl.BLEND);
        }

        // 描画
        {
            const vbo_positions = this.vbo_datas.positions;
            gl.drawArrays(gl.POINTS, 0, vbo_positions.datas.length / vbo_positions.stride_count);
        }

        noise_texture.enableBindTexture(false);
    }
}