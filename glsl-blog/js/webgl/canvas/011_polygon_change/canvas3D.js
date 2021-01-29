/**
 * ポリゴンを表示
 * 異なる形状を切り替えている
 */
class polygon_change extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'polygon_change';

        // 3Dカメラの制御
        this.mouseInterctionCamera = CameraController.createMouseInterction();
        this.mouseInterctionCamera.setup(webGL_data_container.canvas);

        this.is_face = true;
        this.parame_pane = null;
        {
            let pane_element = document.querySelector('#canvas_param_pane')
            if (pane_element != null) {
                this.parame_pane = new Tweakpane({
                    container: pane_element
                });
                this.parame_pane.addInput({ face: this.is_face }, 'face')
                    .on('change', (v) => {
                        this.is_face = v;
                    });
            }
        }

        // 座標変換行列作成
        {
            // ワールドからビュー座標系に変換する行列
            // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));
            this.mat = new Matrix4x4();
        }

        // VBO And IBO作成する情報リスト
        {
            this.vbo_datas = {
                plane_positions: {
                    name: 'planePositions',
                    stride_count: 3,
                    datas: [],
                },

                sphere_positions: {
                    name: 'spherePositions',
                    stride_count: 3,
                    datas: [],
                },

                colors: {
                    name: 'color',
                    stride_count: 4,
                    datas: [],
                },
            };

            this.ido_buffer_data = [];

            // ループ処理で幾何形状の頂点を作成している
            // 使いまわせる！
            const VERTEX_COUNT = 100;
            const WIDTH = 1.0;
            for (let i = 0; i <= VERTEX_COUNT; ++i) {

                // 平面形状のX値を求める
                let x = (i / VERTEX_COUNT) * WIDTH;
                x -= (WIDTH * 0.5);

                // 球形上のXZ値を求める
                let radian = (i / VERTEX_COUNT) * (Math.PI * 2);
                let x02 = Math.sin(radian) * WIDTH;
                let z02 = Math.cos(radian) * WIDTH;

                for (let j = 0; j <= VERTEX_COUNT; ++j) {
                    let y = (j / VERTEX_COUNT) * WIDTH;
                    y -= (WIDTH * 0.5);

                    // 頂点情報設定
                    // 平面形状
                    {
                        this.vbo_datas.plane_positions.datas.push(x, y, 0.0);
                    }

                    // 球形上
                    {
                        // Yの値を求める
                        let sideRadian = (j / VERTEX_COUNT) * Math.PI;

                        let xz02Raidus = Math.sin(sideRadian);
                        let y02 = Math.cos(sideRadian) * WIDTH;
                        this.vbo_datas.sphere_positions.datas.push(x02 * xz02Raidus, y02, z02 * xz02Raidus);
                    }

                    // 頂点色
                    this.vbo_datas.colors.datas.push(i / VERTEX_COUNT, 0.5, j / VERTEX_COUNT, 1.0);

                    // 頂点インデックス追加
                    if (i > 0 && j > 0) {
                        let firstBaseIndex = (i - 1) * (VERTEX_COUNT + 1) + j;
                        let secondBaseIndex = (i) * (VERTEX_COUNT + 1) + j;

                        this.ido_buffer_data.push(
                            firstBaseIndex - 1, firstBaseIndex, secondBaseIndex - 1,
                            secondBaseIndex - 1, firstBaseIndex, secondBaseIndex,
                        );
                    }
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
            mvp_mtx: {
                name: 'mvpMatrix',
                type: 'uniformMatrix4fv',
                datas: this.mat.m
            },
            time: {
                name: 'time',
                type: 'uniform1f',
                datas: 0.0
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
        if (this.parame_pane != null)
            this.parame_pane.dispose();
        this.parame_pane = null;

        common_module.freeObject(this.vbo_datas);
        this.vbo_datas = null;

        common_module.freeObject(this.uniform_datas);
        this.uniform_datas = null;

        common_module.freeObject(this.ido_buffer_data);
        this.ido_buffer_data = null;
    }

    /**
     * 更新
     */
    update(time) {
        const webGL_data_container = this.webGL_data_container;

        this.mouseInterctionCamera.update();

        // fov値を決める
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

        // uniformに渡す行列データを更新
        const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
        mvp_mtx_uniform_data.datas = this.mat.m;

        // uniformに渡す時間データを更新
        const time_uniform_data = this.uniform_datas.time;
        time_uniform_data.datas = time;
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

        // Uniformロケーションにデータ設定
        {
            const color_uniform_data = this.uniform_datas.global_color;
            shader_frame.setUniformData(color_uniform_data.name, color_uniform_data.datas);

            const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
            shader_frame.setUniformData(mvp_mtx_uniform_data.name, mvp_mtx_uniform_data.datas);

            const time_uniform_data = this.uniform_datas.time;
            shader_frame.setUniformData(time_uniform_data.name, time_uniform_data.datas);
        }

        // 転送情報を使用して頂点を画面にレンダリング
        // 第三引数に頂点数を渡している
        if (this.is_face === false) {
            const vbo_positions = this.vbo_datas.plane_positions;
            gl.drawArrays(gl.POINTS, 0, vbo_positions.datas.length / vbo_positions.stride_count);
        }
        else {
            // インデックスバッファで描画
            gl.drawElements(gl.TRIANGLES, this.ido_buffer_data.length, gl.UNSIGNED_SHORT, 0);
        }
    }
}