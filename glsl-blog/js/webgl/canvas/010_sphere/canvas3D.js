/**
 * 球体を表示して頂点シェーダーで球体の頂点を法線ベクトル方向にsinカーブする
 */
class sphere extends Canvas3D {
    constructor(data_file_path, webGL_data_container) {
        super(data_file_path, webGL_data_container);

        this.shader_frame_name = 'sphere';

        // 3Dカメラの制御
        this.mouseInterctionCamera = CameraController.createMouseInterction();
        this.mouseInterctionCamera.setup(webGL_data_container.canvas);

        // 座標変換行列作成
        {
            // ワールドからビュー座標系に変換する行列
            // カメラは原点を見る, 目の位置は原点の後ろ, カメラの軸はy軸ベクトル固定
            this.mView = createLookAtMatrixt4x4FromRighthandCorrdinate(new Vector3(0, 0, 3), new Vector3(0, 0, 0), new Vector3(0, 1, 0));
            this.mat = new Matrix4x4();
        }

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
            };

            // 頂点座標の定義
            // ポリゴンの頂点を作成
            // 頂点座標の定義
            const VERTEX_COUNT = 100;  // 頂点の個数
            const VERTEX_WIDTH = 1.0;  // 頂点が並ぶ範囲の広さ
            // 逆三角錐になる
            /*
            for(let i = 0; i < VERTEX_COUNT; ++i){
                // 0.0 - 1.0の値になる
                let y = i / VERTEX_COUNT;
                // 横の大きさに変換
                y = y * VERTEX_WIDTH;
                // 横の大きさの半分を左下にずらす事で中心位置をピボットにしている
                y = y - (VERTEX_WIDTH / 2.0);
                for(let j = 0; j < VERTEX_COUNT; ++j){
                    let radian = (j / VERTEX_COUNT) * (2 * Math.PI);
    
                    let x = Math.sin(radian) * (i / VERTEX_COUNT);
                    let z = Math.cos(radian) * (i / VERTEX_COUNT);
    
                    this.positions.push(x, y, z);
                    this.pointColors.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 0.5, 1.0);
                }
            }
            */
            // 球形にする
            const sphere_size = 0.5;
            for (let i = 0; i < VERTEX_COUNT; ++i) {
                let radian = (i / VERTEX_COUNT) * (2 * Math.PI);

                // まず円状に座標が動く
                let x = Math.sin(radian);
                let z = Math.cos(radian);

                for (let j = 0; j < VERTEX_COUNT; ++j) {

                    // 半円の角度(0 - 180)のラジアン値を取得
                    let radian2 = (j / VERTEX_COUNT) * Math.PI;

                    // yの座標(-1 - 1)を取得
                    // この変数を変えると色々な形状に変化
                    // 2にするとおわん型になる
                    // 3にするともうわけわからん
                    const y_cos_bias = 1.0;
                    let y = Math.cos(radian2 * y_cos_bias) * sphere_size;
                    // xzの半径(0 - 1)を取得
                    let xzRadius = Math.sin(radian2) * sphere_size;

                    // 頂点情報設定
                    this.vbo_datas.positions.datas.push(x * xzRadius, y, z * xzRadius);

                    // 頂点色
                    this.vbo_datas.colors.datas.push(i / VERTEX_COUNT, j / VERTEX_COUNT, 0.5, 1.0);
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

        // 球体モデル群の座標一覧
        this.modelPositions = [
            new Vector3(0.0, 0.0, 0.0),
            new Vector3(0.0, -2.0, 0.0),
            new Vector3(-1.0, 1.0, 0.0),
            new Vector3(1.0, 1.0, 0.0),
        ];
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

        common_module.freeObject(this.modelPositions);
        this.modelPositions = null;
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
    render(gl, time) {
        const webGL_data_container = this.webGL_data_container;

        // シェーダー更新
        let shader_frame = webGL_data_container.getShaderFrame(this.shader_frame_name);
        // シェーダー有効化
        shader_frame.use();
        // VBO更新
        shader_frame.updateVertexAttribute();

        // Uniformロケーションにデータ設定
        {
            const color_uniform_data = this.uniform_datas.global_color;
            shader_frame.setUniformData(color_uniform_data.name, color_uniform_data.datas);

            const time_uniform_data = this.uniform_datas.time;
            shader_frame.setUniformData(time_uniform_data.name, time_uniform_data.datas);
        }

        // オブジェクト毎の座標を用意しているので計算して行列のUniformに反映かつ描画実行
        {
            let vpMat = new Matrix4x4();
            this.modelPositions.forEach((modelPos) => {
                vpMat.copy(this.mat);

                let mWorld = createTranslationMatrix4x4(modelPos);
                vpMat.mul(mWorld);

                const mvp_mtx_uniform_data = this.uniform_datas.mvp_mtx;
                shader_frame.setUniformData(mvp_mtx_uniform_data.name, vpMat.m);

                // 転送情報を使用して頂点を画面にレンダリング
                // 第三引数に頂点数を渡している
                const vbo_positions = this.vbo_datas.positions;
                gl.drawArrays(gl.POINTS, 0, vbo_positions.datas.length / vbo_positions.stride_count);
            });
        }
    }
}