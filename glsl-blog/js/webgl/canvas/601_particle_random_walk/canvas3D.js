/**
 * ４つのノイズを使って頂点座標をランダムウォークさせる
 * 作成中
 * ４つのランダムを作成してuniform4fvの４要素にそれぞれぶっこむ
 * シェーダー内でその４要素を利用する
 */
class particle_random_walk extends Canvas3D {
    /**
     * コンストラクタ
     */
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_name = 'particle_random_walk';
        this.texture_names = [];
        this.parame_pane = null;
        this.scale_xy = 0.5;
        this.moveZ_scale = 0.2;
        this.point_color_string = '#FFFFFF';
        this.point_colors = common_module.converHEXToRGB(this.point_color_string);
        this.fog_area = 0.1;

        // パラメータ調整GUI生成
        {
            let pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });

                this.parame_pane.addInput(
                    { 'ScaleXY': this.scale_xy },
                    'ScaleXY',
                    { min: 0.1, max: 1.0 }).on('change', (v) => {
                        this.scale_xy = v;
                    });

                this.parame_pane.addInput(
                    { 'MoveZScale': this.moveZ_scale },
                    'MoveZScale',
                    { min: 0.1, max: 1.0 }).on('change', (v) => {
                        this.moveZ_scale = v;
                    });

                // 点色を変える
                this.parame_pane.addInput({ 'Color': this.point_color_string }, 'Color')
                    .on('change', (v) => {
                        this.point_color_string = v;
                        let change_colors = common_module.converHEXToRGB(v);
                        this.point_colors[0] = change_colors[0];
                        this.point_colors[1] = change_colors[1];
                        this.point_colors[2] = change_colors[2];
                    });

                this.parame_pane.addInput(
                    { 'FogArea': this.fog_area },
                    'FogArea',
                    { min: 0.1, max: 1.0 }).on('change', (v) => {
                        this.fog_area = v;
                    });
            }
        }

        // メッシュの頂点生成

        const VERTEX_WIDTH = 2.0;
        {
            // VBOデータ定義
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

                randoms: {
                    name: 'randoms',
                    stride_count: 4,
                    datas: [],
                },
            };

            // メッシュの頂点生成
            const VERTEX_COUNT = 256;
            // -VERTEX_WIDTH - VERTEX_WIDTH の範囲の頂点座標を定義
            const vbo_datas = this.vbo_datas;
            for (let x = 0; x <= VERTEX_COUNT; ++x) {
                // x方向の座標を求める
                const x_pos = 2.0 * VERTEX_WIDTH * (x / VERTEX_COUNT) - VERTEX_WIDTH;

                for (let z = 0; z <= VERTEX_COUNT; ++z) {
                    const z_pos = 2.0 * VERTEX_WIDTH * (z / VERTEX_COUNT) - VERTEX_WIDTH;
                    // y座標はランダム(-0.5 - 0.5)の幅から取得して頂点の幅を掛けている
                    // つまり -VERTEX_WIDTH * 0.5 - VERTEX_WIDTH * 0.5の範囲の値が得る
                    const y_pos = RandomRange(-0.5, 0.5) * VERTEX_WIDTH;

                    // 頂点座標
                    vbo_datas.positions.datas.push(x_pos, y_pos, z_pos);
                    // 頂点のテクスチャ座標
                    vbo_datas.texcoords.datas.push(x / VERTEX_COUNT, z / VERTEX_COUNT);

                    // 頂点ランダム値
                    vbo_datas.randoms.datas.push(
                        RandomRange(0.0, 1.0),
                        RandomRange(0.0, 1.0),
                        RandomRange(0.0, 1.0),
                        1.0,
                        //                        RandomRange(0.0, 1.0),
                    );
                }
            }
        }

        // uniform定義データ
        {
            // uniformを作成するデータ
            this.uniform_datas = {
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
                scale_xy: {
                    name: 'scaleXY',
                    type: 'uniform1f',
                    datas: this.scale_xy,
                },
                moveZ_scale: {
                    name: 'moveZScale',
                    type: 'uniform1f',
                    datas: this.moveZ_scale,
                },
                // 点の色設定
                global_color: {
                    name: 'globalColor',
                    type: 'uniform3fv',
                    datas: this.point_colors,
                },
                // フォグ範囲
                fog_area: {
                    name: 'fogArea',
                    type: 'uniform1f',
                    datas: this.fog_area,
                },
                // 点を配置している範囲値
                point_area_size: {
                    name: 'pointAreaSize',
                    type: 'uniform1f',
                    datas: VERTEX_WIDTH,
                },
            };
        }

        // 3Dカメラ生成
        {
            this.mouseInterctionCamera = CameraController.createMouseInterction();

            const camera = this.mouseInterctionCamera;
            camera.setup(webGL_data_container.canvas);
            camera.setFovScaleMinAndMax(0.5, 1.0);
            camera.scale(1.0);
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
            const shader_frame = this.webGL_data_container.createShaderFrame(
                this.shader_name,
                this.data_file_path + '/vs1.vert',
                this.data_file_path + '/fs1.frag',
            );

            Promise.all([
                shader_frame,
            ]).then((load_results) => {
                // シェーダー構築
                const shader_frame = load_results[0];
                {
                    // VBO生成
                    for (const key in this.vbo_datas) {
                        const vbo_data = this.vbo_datas[key];
                        shader_frame.createVBOAttributeData(
                            vbo_data.name,
                            vbo_data.stride_count,
                            vbo_data.datas
                        );
                    }

                    // Uniform生成
                    for (const key in this.uniform_datas) {
                        const uniform_data = this.uniform_datas[key];
                        shader_frame.createUniformObject(
                            uniform_data.name,
                            uniform_data.type
                        );
                    }
                }

                reslove();
            }).catch((ex) => {
                reject(ex);
            });

        });
    }

    update(time) {
        const webGL_data_container = this.webGL_data_container;

        this.mouseInterctionCamera.update();

        // fov値を決める
        // 値が大きくなるほどカメラの見える範囲が大きくなるので縮小しているようになる
        let fov = 120 * this.mouseInterctionCamera.fovScale;

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

        // アルフェブレンドしている
        gl.enable(gl.BLEND);
        // 描画元の色を描画元のアルファで乗算したのを描画先の色に加算
        // つまり描画先の色が強くなる
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ONE);

        // 奥行きに関係なく全ての点を表示したいのでデプスをOFF
        gl.disable(gl.DEPTH_TEST);

        // この処理共通化出来るかな
        const shader_frame = this.webGL_data_container.getShaderFrame(this.shader_name);
        // シェーダー利用
        {
            shader_frame.use();
            shader_frame.updateVertexAttributeAndIndexBuffer();
        }

        // uniform更新
        {
            const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
            mvp_mtx_uniform_data.datas = this.mat.m;

            const time_uniform_data = this.uniform_datas.time;
            time_uniform_data.datas = render_data.time;

            const move_scale_uniform_data = this.uniform_datas.scale_xy;
            move_scale_uniform_data.datas = this.scale_xy;

            const moveZ_scale_uniform_data = this.uniform_datas.moveZ_scale;
            moveZ_scale_uniform_data.datas = this.moveZ_scale;

            const fog_area_uniform_data = this.uniform_datas.fog_area;
            fog_area_uniform_data.datas = this.fog_area;

            for (const key in this.uniform_datas) {
                const uniform_data = this.uniform_datas[key];
                shader_frame.setUniformData(uniform_data.name, uniform_data.datas);
            }
        }

        // 点描画
        {
            const vbo_positions = this.vbo_datas.positions;
            gl.drawArrays(gl.POINT, 0, vbo_positions.datas.length / vbo_positions.stride_count);
        }
    }
}